export type SampleEmail = {
  id: number;
  from: string;
  subject: string;
  body: string;
  expected: "fatturazione" | "tecnico" | "account" | "commerciale" | "spam";
};

export const SAMPLE_EMAILS: SampleEmail[] = [
  {
    id: 1,
    from: "marta.ferri@studioferri.example",
    subject: "Addebito doppio",
    body: "Buongiorno, questo mese mi avete addebitato due volte l’abbonamento Pro. Potete rimborsarmi il secondo addebito? Grazie.",
    expected: "fatturazione",
  },
  {
    id: 2,
    from: "luca.bianchi@logisticanord.example",
    subject: "API in errore 500",
    body: "Da stamattina tutte le chiamate a /v2/orders rispondono 500. Il nostro gestionale è fermo e i magazzini non riescono a spedire. Urgente!",
    expected: "tecnico",
  },
  {
    id: 3,
    from: "giulia.romano@posta.example",
    subject: "Non riesco ad accedere",
    body: "Ho provato a reimpostare la password tre volte ma la mail di recupero non arriva mai. Come faccio ad entrare?",
    expected: "account",
  },
  {
    id: 4,
    from: "acquisti@farmaciacentrale.example",
    subject: "Preventivo per 40 postazioni",
    body: "Siamo una catena di farmacie e vorremmo attivare il vostro software su 40 postazioni. Avete sconti per volumi? Possiamo fissare una demo?",
    expected: "commerciale",
  },
  {
    id: 5,
    from: "sicurezza@paypa1-verifica.example",
    subject: "Il tuo conto è stato sospeso",
    body: "Gentile cliente, abbiamo rilevato attività sospette. Clicca qui entro 24 ore e inserisci i dati della carta per riattivare il conto.",
    expected: "spam",
  },
  {
    id: 6,
    from: "paolo.greco@greco-arredamenti.example",
    subject: "Fattura intestata male",
    body: "Nella fattura di settembre la partita IVA è sbagliata. Mi serve una nota di credito e una nuova fattura con i dati corretti.",
    expected: "fatturazione",
  },
  {
    id: 7,
    from: "sara.conti@agenziaconti.example",
    subject: "Esportazione CSV vuota",
    body: "Quando esporto i report in CSV il file si scarica ma è vuoto. Succede con Chrome e con Safari. Ho già provato a svuotare la cache.",
    expected: "tecnico",
  },
  {
    id: 8,
    from: "andrea.esposito@esposito.example",
    subject: "Aggiungere un collega",
    body: "Vorrei dare accesso al mio collega Marco come amministratore del nostro spazio di lavoro. Dove trovo questa impostazione?",
    expected: "account",
  },
  {
    id: 9,
    from: "federica.moretti@moretti.example",
    subject: "Passare al piano annuale",
    body: "Siamo sul piano mensile da un anno e ci troviamo bene. Quanto risparmieremmo passando all’annuale? Include anche il supporto prioritario?",
    expected: "commerciale",
  },
  {
    id: 10,
    from: "promo@superofferte-online.example",
    subject: "Hai vinto un iPhone 17!!!",
    body: "Congratulazioni! Sei stato selezionato tra migliaia di utenti. Rispondi a questa email con nome, indirizzo e IBAN per ricevere il premio.",
    expected: "spam",
  },
  {
    id: 11,
    from: "roberto.gallo@gallotrasporti.example",
    subject: "Carta scaduta",
    body: "La mia carta di credito è scaduta e il pagamento di ottobre non è andato a buon fine. Come aggiorno il metodo di pagamento senza perdere i dati?",
    expected: "fatturazione",
  },
  {
    id: 12,
    from: "chiara.lombardi@lombardiviaggi.example",
    subject: "App lentissima",
    body: "Da dopo l’ultimo aggiornamento l’app impiega più di un minuto ad aprire la dashboard. Prima era istantanea. Avete cambiato qualcosa?",
    expected: "tecnico",
  },
  {
    id: 13,
    from: "matteo.costa@costaconsulting.example",
    subject: "Cambio email di accesso",
    body: "Ho cambiato azienda e devo sostituire l’email con cui accedo al mio account, mantenendo tutti i progetti. È possibile?",
    expected: "account",
  },
  {
    id: 14,
    from: "direzione@hotelbellavista.example",
    subject: "Informazioni sul piano Enterprise",
    body: "Gestiamo 12 hotel e ci interessa il piano Enterprise con single sign-on. Potete mandarmi un listino e le condizioni contrattuali?",
    expected: "commerciale",
  },
  {
    id: 15,
    from: "newsletter@crypto-guadagni.example",
    subject: "Raddoppia i tuoi risparmi in 7 giorni",
    body: "Il metodo segreto che le banche non vogliono farti conoscere. Investi oggi 250 euro e ricevi 500 euro garantiti. Posti limitati!",
    expected: "spam",
  },
  {
    id: 16,
    from: "elena.ricci@riccistudio.example",
    subject: "Disdetta e rimborso",
    body: "Ho disdetto l’abbonamento il 3 del mese ma mi è stato addebitato comunque il rinnovo. Vorrei il rimborso, altrimenti contesto il pagamento con la banca.",
    expected: "fatturazione",
  },
  {
    id: 17,
    from: "davide.marino@marinoshop.example",
    subject: "Webhook non arrivano",
    body: "Il nostro endpoint non riceve più i webhook degli ordini da ieri sera. Nei log vediamo timeout dal vostro lato. Potete controllare?",
    expected: "tecnico",
  },
  {
    id: 18,
    from: "irene.fontana@fontana-legal.example",
    subject: "Autenticazione a due fattori",
    body: "Ho perso il telefono con l’app di autenticazione e ora non riesco più ad entrare. Come posso disattivare la verifica in due passaggi?",
    expected: "account",
  },
  {
    id: 19,
    from: "stefano.villa@villaimmobiliare.example",
    subject: "Il prezzo è aumentato?",
    body: "Ho visto che il piano Pro ora costa di più. Io pago ancora il prezzo vecchio? Se passo al piano Team il prezzo resta bloccato?",
    expected: "commerciale",
  },
  {
    id: 20,
    from: "alessia.bruno@brunofood.example",
    subject: "Addebito dopo il downgrade",
    body: "Ho fatto il downgrade al piano Base ma non riesco più ad accedere ai progetti archiviati e in più mi avete addebitato il piano Pro. Cosa è successo?",
    expected: "fatturazione",
  },
];
