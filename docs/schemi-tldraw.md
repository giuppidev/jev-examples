# Schemi per tldraw

Uno schema per ogni passo del video. Dopo ogni schema: apri il file indicato nell'editor, poi premi "Esegui" nell'app.

---

## 1. Cos'è classificare

```
            ┌──────────────┐
 [email] ──▶│ classificatore│──▶  ☐ fatturazione
            └──────────────┘      ☑ tecnico
                                  ☐ account
                                  ☐ commerciale
                                  ☐ spam
```

**Da dire:** "Classificare vuol dire mettere un'etichetta. È l'impiegato dell'ufficio posta che legge la lettera e la mette nella casella giusta. Le caselle si chiamano *label*."

**Nell'app:** le cinque caselle sono sempre le stesse (fatturazione, tecnico, account, commerciale, spam) e ogni file le scrive per esteso.

---

## 2. L'LLM: scrive la risposta

```
 [istruzioni + caselle scritte nel prompt]
 [email]
        │
        ▼
   ┌─────────┐
   │   LLM   │──▶ "fat" ─▶ "tur" ─▶ "azione"  ──▶ fatturazione
   └─────────┘     un token alla volta
```

**Da dire:** "L'LLM capisce tutto, e le caselle gliele descrivo a parole nel prompt. Però risponde *scrivendo*, un pezzo di parola alla volta: i *token*. Ogni token è un passaggio del modello. E non mi dice quanto è sicuro."

**File:** `lib/1-choice/1-llm.ts`. Da far notare: le caselle finiscono nel `system` come testo; `Output.choice` obbliga il modello a scegliere tra quelle; il ragionamento è spento, per dare all'LLM la massima velocità possibile.

---

## 3. BERT: legge tutto insieme, ma è rigido

```
 [email] ──▶ ┌──────┐ ──▶ [ 0.8  0.1  0.05 ... ]  ──▶ fatturazione 80%
             │ BERT │      un punteggio per casella
             └──────┘
              gira sul tuo computer
```

**Da dire:** "BERT, del 2018, fa un'altra cosa: legge tutta l'email in un colpo e produce direttamente un numero per ogni casella. Niente testo da scrivere: veloce ed economico, gira perfino nel browser. Il problema è che normalmente va *addestrato* sulle tue caselle con migliaia di esempi già smistati: è il *fine-tuning*. Se aggiungi una casella, devi riaddestrarlo."

### 3b. Il trucco zero-shot

```
 "Questa email riguarda: addebiti, fatture…"   → sì 34%
 "Questa email riguarda: bug, errori…"         → sì 15%
 "Questa email riguarda: accesso, password…"   → sì 24%
 ...                                             una domanda per casella
```

**Da dire:** "Per non riaddestrarlo usiamo la versione *zero-shot*: BERT si chiede, casella per casella, 'questa frase è vera?'. Funziona, ma è poco preciso: guarda le percentuali, 34% contro 24%."

**File:** `lib/1-choice/2-bert.ts`

---

## 4. Jev: capisce come un LLM, risponde come BERT

```
 [stato: email]          ┌─────┐     fatturazione  ████████░ 91%
 [domande: caselle]  ──▶ │ Jev │ ──▶ account       █░░░░░░░░  6%
                         └─────┘     tecnico       ░░░░░░░░░  2%
                       un solo passaggio         + confidence
```

**Da dire:** "Jev prende il meglio di entrambi. Le caselle gliele passo al momento, come all'LLM, ma come *dati*, non come testo nel prompt. E non scrive niente: in un solo passaggio indica la casella e dice quanto crede in ognuna. Quando dice 90%, ha ragione circa 9 volte su 10: si dice che è *calibrato*."

**File:** `lib/1-choice/3-jev.ts`: confrontalo riga per riga con `1-llm.ts`.

---

## 5. Tre tipi di domanda: choice, score, boolean

```
 choice   quale reparto?        fatturazione │ tecnico │ account │ …     una casella, senza ordine

 score    quanto è urgente?     0 ──── 1 ──── 2 ──●─ 3                 una posizione sul righello
                                                 2.86

 boolean  chiede un rimborso?   sì ██████████░ 97%                    la probabilità del sì
```

**Da dire:** "Jev ha tre tipi di domanda. *Choice*: scegli una casella tra tante. *Score*: i livelli sono in ordine, quindi la risposta è una media pesata e può cadere tra due livelli, per esempio 2.86. *Boolean*: sì o no, con la probabilità del sì. L'LLM, invece, a ognuna di queste domande risponde solo scrivendo una parola: `2`, `sì`."

**File:** `lib/2-score/` e `lib/3-boolean/`, ognuna con `1-llm.ts`, `2-bert.ts` e `3-jev.ts`. Nel Playground ogni classificatore ha i tre check uno sotto l'altro: choice, score, boolean.

---

## 6. System 1 e System 2

```
   System 2 (lento, ragiona)        System 1 (veloce, decide)
   ┌─────────┐                      ┌─────┐
   │   LLM   │  scrive              │ Jev │  decide
   └─────────┘                      └─────┘
          └──────── nelle app reali servono entrambi ────────┘
```

**Da dire:** "Kahneman, *Pensieri lenti e veloci*: il System 2 ragiona con calma, il System 1 decide d'istinto. L'LLM è System 2, Jev è System 1."

**Nell'app:** la gara su 20 email nel Playground.

---

## 7. L'app reale: l'helpdesk

```
 email in arrivo
       │
       ▼
   ┌─────┐  6 domande, 1 chiamata         ┌──────────────┐
   │ Jev │──▶ reparto, urgenza, rimborso, ─▶│ codice nostro│──▶ cartella
   └─────┘    phishing, arrabbiato, dati   │  (if / else) │
                                           └──────────────┘
                                                  │ confidence < 60%
                                                  ▼
                                           revisione umana

 email aperta ──▶ ┌─────┐ ──▶ bozza di risposta
                  │ LLM │
                  └─────┘
```

**Da dire:** "Jev decide, l'LLM scrive. Jev risponde a sei domande in una sola chiamata, e le probabilità diventano normali `if` nel mio codice. Se non è sicuro, decide una persona. L'LLM lo chiamo solo quando serve scrivere."

**File:** prima `lib/4-inbox/1-triage-llm.ts`, cioè lo stesso triage fatto come si fa oggi, con `generateText` + `Output.object` e uno schema Zod. Poi `lib/4-inbox/2-triage-jev.ts` e `lib/4-inbox/3-draft-reply.ts`.

**Da far notare:** le domande sono le stesse, ma con lo schema l'LLM restituisce solo `true`/`false` e un numero intero per l'urgenza. Senza confidence non esiste la cartella "Revisione umana": l'LLM non sa dirti quando non è sicuro. Nell'inbox puoi cambiare "Smista con" e ricevere le stesse email con Claude, per far sentire l'attesa.
