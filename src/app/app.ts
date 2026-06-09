import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Friend {
  id: number;
  name: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  title = 'Fanta-Defence 2026/27';

  // Navigation: tabs are 'home' (Presentazione), 'regole' (Regole del Torneo), 'iscrizione' (Form di Iscrizione)
  activeTab = signal<'home' | 'regole' | 'iscrizione'>('home');

  // Referral Calculator State
  userName = signal<string>('');
  userType = signal<'veteran' | 'new'>('new');
  hasReferrer = signal<boolean>(false);
  referrerName = signal<string>('');
  invitedFriends = signal<Friend[]>([]);
  newFriendInput = signal<string>('');

  // Referral Calculations
  userFee = computed<number>(() => {
    // Standard fee is 25€.
    // Discounted to 20€ if:
    // - User is new and has a referrer (invited by a veteran/friend).
    // - User invites at least one new person.
    if (this.userType() === 'new' && this.hasReferrer() && this.referrerName().trim() !== '') {
      return 20;
    }
    if (this.invitedFriends().length > 0) {
      return 20;
    }
    return 25;
  });

  userSavings = computed<number>(() => {
    return 25 - this.userFee();
  });

  friendsSavings = computed<number>(() => {
    // Each invited friend is a new participant, paying 20€ instead of 25€ (saving 5€ each)
    return this.invitedFriends().length * 5;
  });

  totalGroupSavings = computed<number>(() => {
    return this.userSavings() + this.friendsSavings();
  });

  totalGroupCost = computed<number>(() => {
    return this.userFee() + (this.invitedFriends().length * 20);
  });

  // Copy success feedback
  copySuccess = signal<boolean>(false);

  // Set navigation tab
  setTab(tab: 'home' | 'regole' | 'iscrizione') {
    this.activeTab.set(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Referral Calculator methods
  addFriend() {
    const name = this.newFriendInput().trim();
    if (name) {
      const current = this.invitedFriends();
      const nextId = current.length > 0 ? Math.max(...current.map(f => f.id)) + 1 : 1;
      this.invitedFriends.set([...current, { id: nextId, name }]);
      this.newFriendInput.set('');
    }
  }

  removeFriend(id: number) {
    this.invitedFriends.set(this.invitedFriends().filter(f => f.id !== id));
  }

  // Email Generator Content
  emailSubject = computed<string>(() => {
    const name = this.userName().trim() || 'Nuovo Partecipante';
    return `Iscrizione Fanta-Defence 2026/27 - ${name}`;
  });

  emailBody = computed<string>(() => {
    const name = this.userName().trim() || '[Tuo Nome e Cognome]';
    const typeStr = this.userType() === 'new' ? 'Nuovo Iscritto' : 'Veterano';
    
    let body = `Ciao Fanta-Defenders! ⚽️\n\n`;
    body += `Vorrei iscrivermi alla prossima stagione del Fanta-Defence (2026/27).\n\n`;
    body += `Ecco i miei dati:\n`;
    body += `- Nome e Cognome: ${name} (${typeStr})\n`;
    
    if (this.userType() === 'new' && this.hasReferrer() && this.referrerName().trim() !== '') {
      body += `- Referral (mi ha invitato): ${this.referrerName().trim()}\n`;
    }
    
    if (this.invitedFriends().length > 0) {
      body += `\nDesidero inoltre invitare i seguenti nuovi amici per attivare la promozione referral:\n`;
      this.invitedFriends().forEach((friend, idx) => {
        body += `${idx + 1}. Nome: ${friend.name} (Nuovo Iscritto) - Invitato da: ${name}\n`;
      });
      body += `\nNota: in base alla promo referral, la quota per ciascuno di noi sarà di 20€ anziché 25€.\n`;
    } else if (this.userType() === 'new' && this.hasReferrer() && this.referrerName().trim() !== '') {
      body += `\nNota: essendo un nuovo iscritto invitato, ho diritto alla quota promozionale di 20€.\n`;
    } else {
      body += `\nQuota standard prevista: 25€ (non ho referral attivi al momento).\n`;
    }
    
    body += `\nAttendo le indicazioni per effettuare il pagamento della quota.\n\n`;
    body += `Grazie e buon Fanta-Defence!\n`;
    
    return body;
  });

  emailMailto = computed<string>(() => {
    const subjectEncoded = encodeURIComponent(this.emailSubject());
    const bodyEncoded = encodeURIComponent(this.emailBody());
    return `mailto:info@fanta-defence.it?subject=${subjectEncoded}&body=${bodyEncoded}`;
  });

  copyEmailText() {
    const text = this.emailBody();
    navigator.clipboard.writeText(text).then(() => {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    });
  }
}
