export interface ChecklistQuestion {
  id: string;
  type: 'radio' | 'checkbox' | 'text' | 'select' | 'textarea'; // Added textarea
  labelEn: string;
  labelFr: string;
  infoEn?: string; // <-- New field for help tooltips
  infoFr?: string; // <-- New field for help tooltips
  options?: { value: string; labelEn: string; labelFr: string }[];
}

export interface ChecklistSection {
  id: string;
  titleEn: string;
  titleFr: string;
  questions: ChecklistQuestion[];
}

// --- THIS IS THE NEW, EXPANDED CONFIG ---
// --- THIS IS THE NEW, EXPANDED CONFIG ---
export const checklistConfig: ChecklistSection[] = [
  {
    id: 'context',
    titleEn: 'About Your Business',
    titleFr: 'À Propos de Votre Entreprise',
    questions: [
      {
        id: 'company_size',
        type: 'select',
        labelEn: 'How many employees are in your Quebec operations?',
        labelFr: 'Combien d\'employés compte votre entreprise au Québec?',
        infoEn: 'Critical for Bill 96 thresholds (25+ triggers francization obligations).',
        infoFr: 'Critique pour les seuils de la Loi 96 (25+ déclenche des obligations de francisation).',
        options: [
          { value: '1-24',  labelEn: '1-24 employees',  labelFr: '1-24 employés' },
          { value: '25-49', labelEn: '25-49 employees', labelFr: '25-49 employés' },
          { value: '50-99', labelEn: '50-99 employees', labelFr: '50-99 employés' },
          { value: '100-249', labelEn: '100-249 employees', labelFr: '100-249 employés' },
          { value: '250+', labelEn: '250+ employees', labelFr: '250+ employés' },
        ],
      },
      {
        id: 'oqlf_status',
        type: 'select',
        labelEn: 'OQLF francization status (if applicable)',
        labelFr: 'Statut de francisation OQLF (le cas échéant)',
        infoEn: 'Helps generate an appropriate Francization Program Draft.',
        infoFr: 'Aide à générer un plan de francisation adapté.',
        options: [
          { value: 'not_started', labelEn: 'Not started', labelFr: 'Non commencé' },
          { value: 'in_progress',  labelEn: 'In progress', labelFr: 'En cours' },
          { value: 'approved',     labelEn: 'Approved/Certified', labelFr: 'Approuvé/Certifié' },
          { value: 'unknown',      labelEn: 'Unknown', labelFr: 'Inconnu' },
        ],
      },
      {
        id: 'b2c_or_b2b',
        type: 'select',
        labelEn: 'Go-to-market focus',
        labelFr: 'Cible de marché',
        infoEn: 'Some Bill 96/Law 25 nuances differ for consumer vs. enterprise contexts.',
        infoFr: 'Certaines nuances diffèrent entre contexte consommateur et entreprise.',
        options: [
          { value: 'b2c', labelEn: 'B2C', labelFr: 'B2C' },
          { value: 'b2b', labelEn: 'B2B', labelFr: 'B2B' },
          { value: 'both', labelEn: 'Both', labelFr: 'Les deux' },
        ],
      },
      {
        id: 'industry',
        type: 'select',
        labelEn: 'What is your primary industry?',
        labelFr: 'Quel est votre secteur d\'activité principal?',
        infoEn: 'Used to tailor privacy policy & examples.',
        infoFr: 'Utilisé pour adapter la politique de confidentialité & les exemples.',
        options: [
          { value: 'saas',       labelEn: 'SaaS / Tech',                     labelFr: 'SaaS / Technologie' },
          { value: 'ecommerce',  labelEn: 'E-commerce (Online Store)',       labelFr: 'E-commerce (Boutique en ligne)' },
          { value: 'hospitality',labelEn: 'Hospitality (restaurant/hotel)',  labelFr: 'Hôtellerie (restaurant/hôtel)' },
          { value: 'services',   labelEn: 'Local/Professional Services',     labelFr: 'Services professionnels' },
          { value: 'blog',       labelEn: 'Blog / Content Creator',          labelFr: 'Blog / Créateur de contenu' },
          { value: 'other',      labelEn: 'Other',                           labelFr: 'Autre' },
        ],
      },
    ],
  },

  {
    id: 'law25',
    titleEn: 'Law 25 - Privacy & Data',
    titleFr: 'Loi 25 - Vie Privée et Données',
    questions: [
      {
        id: 'privacy_officer_email',
        type: 'text',
        labelEn: 'Privacy Officer email',
        labelFr: 'Courriel du Responsable de la protection des renseignements personnels',
        infoEn: 'We will insert this into your policy template.',
        infoFr: 'Nous l’intégrerons au modèle de politique.',
      },
      {
        id: 'data_types_collected',
        type: 'checkbox',
        labelEn: 'What data do you knowingly collect? (select all)',
        labelFr: 'Quelles données collectez-vous sciemment? (sélectionnez tout)',
        infoEn: 'Determines sensitivity, retention and disclosures.',
        infoFr: 'Détermine sensibilité, conservation et divulgations.',
        options: [
          { value: 'contact',   labelEn: 'Contact (name/email/phone)',     labelFr: 'Contact (nom/courriel/téléphone)' },
          { value: 'payment',   labelEn: 'Payment (via processor)',        labelFr: 'Paiement (via processeur)' },
          { value: 'minors',    labelEn: 'Minors (under 14)',              labelFr: 'Mineurs (moins de 14 ans)' },
          { value: 'biometric', labelEn: 'Biometric',                       labelFr: 'Biométrique' },
        ],
      },
      {
        id: 'third_party_tools',
        type: 'checkbox',
        labelEn: 'Third-party tools in use (select all)',
        labelFr: 'Outils tiers utilisés (sélectionnez tout)',
        infoEn: 'Third parties often imply cross-border transfers & PIA.',
        infoFr: 'Les tiers impliquent souvent des transferts transfrontaliers et une ÉFVP.',
        options: [
          { value: 'analytics',      labelEn: 'Analytics (GA4, Plausible…)',  labelFr: 'Analytique (GA4, Plausible…)' },
          { value: 'marketing',      labelEn: 'Email Marketing (Mailchimp…)', labelFr: 'Marketing courriel (Mailchimp…)' },
          { value: 'pixel',          labelEn: 'Ad Pixels (Meta, TikTok…)',    labelFr: 'Pixels publicitaires (Meta, TikTok…)' },
          { value: 'crm',            labelEn: 'CRM (HubSpot, Salesforce)',    labelFr: 'CRM (HubSpot, Salesforce)' },
          { value: 'payments',       labelEn: 'Payments (Stripe, PayPal)',    labelFr: 'Paiements (Stripe, PayPal)' },
          { value: 'supportdesk',    labelEn: 'Support Desk (Zendesk, Intercom)', labelFr: 'Support (Zendesk, Intercom)' },
          { value: 'cloud_storage',  labelEn: 'Cloud Storage (S3, GCS)',      labelFr: 'Stockage cloud (S3, GCS)' },
          { value: 'none',           labelEn: 'None of these',                labelFr: 'Aucun' },
        ],
      },
      {
        id: 'has_data_inventory',
        type: 'radio',
        labelEn: 'Do you maintain a data inventory / RoPA?',
        labelFr: 'Tenez-vous un inventaire des données / registre (RoPA)?',
        options: [
          { value: 'yes', labelEn: 'Yes', labelFr: 'Oui' },
          { value: 'no',  labelEn: 'No',  labelFr: 'Non' },
        ],
      },
      {
        id: 'has_retention_schedule',
        type: 'radio',
        labelEn: 'Do you have a documented data retention schedule?',
        labelFr: 'Avez-vous un calendrier de conservation documenté?',
        options: [
          { value: 'yes', labelEn: 'Yes', labelFr: 'Oui' },
          { value: 'no',  labelEn: 'No',  labelFr: 'Non' },
        ],
      },
      {
        id: 'cross_border_transfers',
        type: 'radio',
        labelEn: 'Do you transfer personal data outside Quebec/Canada?',
        labelFr: 'Transférez-vous des données personnelles hors Québec/Canada?',
        options: [
          { value: 'yes', labelEn: 'Yes', labelFr: 'Oui' },
          { value: 'no',  labelEn: 'No',  labelFr: 'Non' },
        ],
      },
      {
        id: 'incident_response_plan',
        type: 'radio',
        labelEn: 'Do you have an incident/breach response playbook?',
        labelFr: 'Avez-vous un plan d’intervention en cas d’incident/atteinte?',
        options: [
          { value: 'yes', labelEn: 'Yes', labelFr: 'Oui' },
          { value: 'no',  labelEn: 'No',  labelFr: 'Non' },
        ],
      },
      {
        id: 'automated_decision_making',
        type: 'radio',
        labelEn: 'Do you use automated decision-making (ADM) that can affect users?',
        labelFr: 'Utilisez-vous une prise de décision automatisée (PDA) pouvant affecter les utilisateurs?',
        infoEn: 'If yes, Law 25 requires disclosure and a human review path.',
        infoFr: 'Si oui, la Loi 25 exige un avis et une révision humaine.',
        options: [
          { value: 'yes', labelEn: 'Yes', labelFr: 'Oui' },
          { value: 'no',  labelEn: 'No',  labelFr: 'Non' },
        ],
      },
      {
        id: 'adm_use_cases',
        type: 'checkbox',
        labelEn: '(If yes) ADM use cases',
        labelFr: '(Si oui) Cas d’usage de la PDA',
        options: [
          { value: 'fraud_detection', labelEn: 'Fraud detection', labelFr: 'Détection de fraude' },
          { value: 'feature_gating',  labelEn: 'Feature gating / Access control', labelFr: 'Restriction de fonctionnalités / Accès' },
          { value: 'pricing',         labelEn: 'Dynamic pricing / scoring', labelFr: 'Tarification / scoring' },
          { value: 'other',           labelEn: 'Other', labelFr: 'Autre' },
        ],
      },
      {
        id: 'policy_review',
        type: 'textarea',
        labelEn: '(Optional) Paste your current Privacy Policy here for AI review',
        labelFr: '(Optionnel) Collez votre Politique de confidentialité actuelle pour révision IA',
      },
    ],
  },

  {
    id: 'bill96',
    titleEn: 'Bill 96 - Language (OQLF)',
    titleFr: 'Loi 96 - Langue (OQLF)',
    questions: [
      {
        id: 'default_site_lang',
        type: 'select',
        labelEn: 'Default website language',
        labelFr: 'Langue par défaut du site web',
        options: [
          { value: 'fr',    labelEn: 'French',  labelFr: 'Français' },
          { value: 'en',    labelEn: 'English', labelFr: 'Anglais' },
          { value: 'other', labelEn: 'Other',   labelFr: 'Autre' },
        ],
      },
      {
        id: 'customer_facing_french',
        type: 'select',
        labelEn: 'Customer-facing content available in French?',
        labelFr: 'Contenu destiné aux clients disponible en français?',
        options: [
          { value: 'full',    labelEn: 'Fully',       labelFr: 'Complet' },
          { value: 'partial', labelEn: 'Partially',   labelFr: 'Partiel' },
          { value: 'none',    labelEn: 'Not available', labelFr: 'Non disponible' },
        ],
      },
      {
        id: 'software_ui_french',
        type: 'select',
        labelEn: 'Is the software/app UI available in French?',
        labelFr: 'L’interface du logiciel/app est-elle disponible en français?',
        options: [
          { value: 'available', labelEn: 'Available',      labelFr: 'Disponible' },
          { value: 'partial',   labelEn: 'Partially',      labelFr: 'Partiellement' },
          { value: 'not_available', labelEn: 'Not available', labelFr: 'Non disponible' },
        ],
      },
      {
        id: 'contracts_in_french',
        type: 'select',
        labelEn: 'Contracts/ToS available in French?',
        labelFr: 'Contrats/CGU disponibles en français?',
        options: [
          { value: 'all',  labelEn: 'All contracts/ToS', labelFr: 'Tous les contrats/CGU' },
          { value: 'some', labelEn: 'Some',              labelFr: 'Certains' },
          { value: 'none', labelEn: 'None',              labelFr: 'Aucun' },
        ],
      },
      {
        id: 'tos_french',
        type: 'radio',
        labelEn: 'Are your ToS presented in French (before English)?',
        labelFr: 'Vos CGU sont-elles présentées en français (avant l’anglais)?',
        options: [
          { value: 'yes', labelEn: 'Yes, French first', labelFr: 'Oui, français en premier' },
          { value: 'no',  labelEn: 'No',                labelFr: 'Non' },
          { value: 'na',  labelEn: 'N/A (no ToS)',      labelFr: 'S/O (pas de CGU)' },
        ],
      },
      {
        id: 'internal_docs_french',
        type: 'radio',
        labelEn: 'Internal docs (contracts, manuals) available in French?',
        labelFr: 'Documents internes (contrats, manuels) disponibles en français?',
        options: [
          { value: 'yes', labelEn: 'Yes', labelFr: 'Oui' },
          { value: 'no',  labelEn: 'No',  labelFr: 'Non' },
          { value: 'na',  labelEn: 'N/A (no employees)', labelFr: 'S/O (pas d’employés)' },
        ],
      },
      {
        id: 'job_postings',
        type: 'radio',
        labelEn: 'Do you post job offers for positions in Quebec?',
        labelFr: 'Publiez-vous des offres d’emploi pour des postes au Québec?',
        options: [
          { value: 'yes', labelEn: 'Yes', labelFr: 'Oui' },
          { value: 'no',  labelEn: 'No',  labelFr: 'Non' },
        ],
      },
      {
        id: 'keeps_proof_job_postings',
        type: 'radio',
        labelEn: 'Do you keep proof of French job postings (screenshots/links)?',
        labelFr: 'Conservez-vous une preuve des offres publiées en français (captures/liens)?',
        options: [
          { value: 'yes', labelEn: 'Yes', labelFr: 'Oui' },
          { value: 'no',  labelEn: 'No',  labelFr: 'Non' },
        ],
      },
      {
        id: 'signage',
        type: 'radio',
        labelEn: 'Do you have outdoor public signage in Quebec?',
        labelFr: 'Avez-vous de l’affichage public extérieur au Québec?',
        options: [
          { value: 'yes', labelEn: 'Yes', labelFr: 'Oui' },
          { value: 'no',  labelEn: 'No',  labelFr: 'Non' },
        ],
      },
      {
        id: 'has_non_french_signage',
        type: 'radio',
        labelEn: '(If signage) Is any outdoor text non-French or not markedly predominant in French?',
        labelFr: '(Si affichage) Y a-t-il du texte non français ou un français non nettement prédominant?',
        options: [
          { value: 'yes', labelEn: 'Yes', labelFr: 'Oui' },
          { value: 'no',  labelEn: 'No',  labelFr: 'Non' },
          { value: 'na',  labelEn: 'N/A (no signage)', labelFr: 'S/O (pas d’affichage)' },
        ],
      },
      {
        id: 'non_french_trademark',
        type: 'radio',
        labelEn: 'Do you use a non-French trademark (brand name) on website or signage?',
        labelFr: 'Utilisez-vous une marque de commerce non française sur le site ou l’affichage?',
        options: [
          { value: 'yes', labelEn: 'Yes', labelFr: 'Oui' },
          { value: 'no',  labelEn: 'No',  labelFr: 'Non' },
        ],
      },
    ],
  },
];
