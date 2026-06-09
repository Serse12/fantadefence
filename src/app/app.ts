import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Friend {
  id: number;
  name: string;
  nickname: string;
  phone: string;
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
  isMenuOpen = signal<boolean>(false);

  // Referral Calculator State
  userName = signal<string>('');
  userNickname = signal<string>('');
  userPhone = signal<string>('');
  userType = signal<'veteran' | 'new'>('new');
  hasReferrer = signal<boolean>(false);
  referrerName = signal<string>('');
  invitedFriends = signal<Friend[]>([]);
  newFriendName = signal<string>('');
  newFriendNickname = signal<string>('');
  newFriendPhone = signal<string>('');

  // Referral Calculations
  userFee = computed<number>(() => {
    // Standard fee is 25€ for veterans, 20€ for new entries.
    // Only veterans get a 5€ discount for each invited friend.
    const baseFee = this.userType() === 'new' ? 20 : 25;
    const discount = this.userType() === 'veteran' ? this.invitedFriends().length * 5 : 0;
    return Math.max(0, baseFee - discount);
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
    this.isMenuOpen.set(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Referral Calculator methods
  addFriend() {
    const name = this.newFriendName().trim();
    const nickname = this.newFriendNickname().trim();
    const phone = this.newFriendPhone().trim();
    if (name && nickname) {
      const current = this.invitedFriends();
      const nextId = current.length > 0 ? Math.max(...current.map(f => f.id)) + 1 : 1;
      this.invitedFriends.set([...current, { id: nextId, name, nickname, phone }]);
      this.newFriendName.set('');
      this.newFriendNickname.set('');
      this.newFriendPhone.set('');
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
    const nickname = this.userNickname().trim() || '[Tuo Nickname su Fantacalcio.it]';
    const phone = this.userPhone().trim();
    const typeStr = this.userType() === 'new' ? 'Nuovo Iscritto' : 'Veterano';
    
    let body = `Ciao Fanta-Defenders! ⚽️\n\n`;
    body += `Vorrei iscrivermi alla prossima stagione del Fanta-Defence (2026/27).\n\n`;
    body += `Ecco i miei dati:\n`;
    body += `- Nome e Cognome: ${name} (${typeStr})\n`;
    body += `- Nickname su Fantacalcio.it: ${nickname}\n`;
    if (phone) {
      body += `- Numero di Telefono: ${phone}\n`;
    }
    
    if (this.userType() === 'new' && this.hasReferrer() && this.referrerName().trim() !== '') {
      body += `- Referral (mi ha invitato): ${this.referrerName().trim()}\n`;
    }
    
    if (this.invitedFriends().length > 0) {
      body += `\nDesidero inoltre invitare i seguenti nuovi amici per l'iscrizione:\n`;
      this.invitedFriends().forEach((friend, idx) => {
        let friendInfo = `- Amico ${idx + 1}: ${friend.name} (Nickname: ${friend.nickname}`;
        if (friend.phone) {
          friendInfo += `, Tel: ${friend.phone}`;
        }
        friendInfo += `)\n`;
        body += friendInfo;
      });
      if (this.userType() === 'veteran') {
        body += `\nNota: essendo un veterano e avendo invitato ${this.invitedFriends().length} nuovi amici, ho diritto a uno sconto di ${this.invitedFriends().length * 5}€ sulla mia quota. Gli amici invitati pagheranno la quota scontata di 20€ ciascuno.\n`;
      } else {
        body += `\nNota: i nuovi amici invitati pagheranno la quota scontata di 20€ ciascuno. Trattandosi di iscrizione da parte di un nuovo utente, non è previsto sconto sugli inviti.\n`;
      }
    } else if (this.userType() === 'new') {
      body += `\nNota: essendo un nuovo iscritto, ho diritto alla quota di ingresso di 20€.\n`;
    } else {
      body += `\nQuota standard prevista: 25€ (non ho invitato nuovi amici al momento).\n`;
    }
    
    body += `La mia quota finale calcolata è di ${this.userFee()}€.\n`;
    
    body += `\nAttendo le indicazioni per effettuare il pagamento della quota.\n\n`;
    body += `Grazie e buon Fanta-Defence!\n`;
    
    return body;
  });

  emailMailto = computed<string>(() => {
    const subjectEncoded = encodeURIComponent(this.emailSubject());
    const bodyEncoded = encodeURIComponent(this.emailBody());
    return `mailto:fanta.defence@gmail.com?subject=${subjectEncoded}&body=${bodyEncoded}`;
  });

  copyEmailText() {
    const text = this.emailBody();
    navigator.clipboard.writeText(text).then(() => {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    });
  }
}
