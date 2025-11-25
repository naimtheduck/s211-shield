import { useAuditStore } from '../lib/store';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

// A simple bilingual text hook for this page
const useLegalText = () => {
  const language = useAuditStore((state) => state.language);
  
  const content = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last Updated: November 6, 2025',
      sections: [
        { 
          title: '1. Introduction',
          body: 'Quebec Compliance ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and disclose personal information in compliance with Quebec\'s Law 25.'
        },
        { 
          title: '2. What We Collect',
          body: 'We collect the following personal information when you use our service: \n- Email Address: To create your audit and contact you. \n- Website URL: To perform the compliance scan. \n- Scan Results: The output of our audit, which is linked to your email. \n- Payment Information: If you purchase our Premium Audit, your payment is processed by a third-party (e.g., Stripe). We do not store your credit card details.'
        },
        { 
          title: '3. How We Use Your Information',
          body: 'Your information is used to: \n- Provide, operate, and maintain our compliance audit service. \n- Create your anonymous or registered user account. \n- Process your one-time payment for premium features. \n- Communicate with you, including sending service-related emails.'
        },
        { 
          title: '4. Consent',
          body: 'By providing us with your email and website URL, you consent to the collection and use of this information as described in this policy. For any non-essential data collection, such as analytics cookies, we will ask for your explicit consent via a cookie banner.'
        },
        { 
          title: '5. Data Storage & Security',
          body: 'Your audit data is securely stored using Supabase. We take reasonable measures to protect your personal information from loss, theft, and unauthorized access. Your `user_id` is stored in the `audits` table to link your scan to your account.'
        },
        { 
          title: '6. Your Rights (Law 25)',
          body: 'As a Quebec resident, you have the right to: \n- Access your personal information. \n- Rectify (correct) your personal information. \n- Withdraw your consent at any time. \n- Request the deletion (de-indexation) of your information. \nTo exercise these rights, please contact our Privacy Officer.'
        },
        { 
          title: '7. Privacy Officer',
          body: 'We have designated a Privacy Officer to oversee compliance with this policy. \n\nAlejandro Monge \nPrivacy Officer \nalex@loi96facile'
        },
      ]
    },
    fr: {
      title: 'Politique de Confidentialité',
      lastUpdated: 'Dernière mise à jour : 6 novembre 2025',
      sections: [
        { 
          title: '1. Introduction',
          body: 'Quebec Compliance ("nous", "notre") s\'engage à protéger votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons et divulguons les renseignements personnels conformément à la Loi 25 du Québec.'
        },
        { 
          title: '2. Ce que nous collectons',
          body: 'Nous collectons les renseignements personnels suivants lorsque vous utilisez notre service : \n- Adresse courriel : Pour créer votre audit et vous contacter. \n- URL du site Web : Pour effectuer le scan de conformité. \n- Résultats du scan : Le résultat de notre audit, qui est lié à votre courriel. \n- Informations de paiement : Si vous achetez notre audit Premium, votre paiement est traité par un tiers (par ex., Stripe). Nous ne stockons pas les détails de votre carte de crédit.'
        },
        { 
          title: '3. Comment nous utilisons vos informations',
          body: 'Vos informations sont utilisées pour : \n- Fournir, exploiter et maintenir notre service d\'audit de conformité. \n- Créer votre compte utilisateur anonyme ou enregistré. \n- Traiter votre paiement unique pour les fonctionnalités premium. \n- Communiquer avec vous, y compris pour l\'envoi de courriels liés au service.'
        },
        { 
          title: '4. Consentement',
          body: 'En nous fournissant votre courriel et l\'URL de votre site Web, vous consentez à la collecte et à l\'utilisation de ces informations comme décrit dans cette politique. Pour toute collecte de données non essentielles, telle que les témoins (cookies) d\'analyse, nous demanderons votre consentement explicite via une bannière de témoins.'
        },
        { 
          title: '5. Stockage et Sécurité des Données',
          body: 'Vos données d\'audit sont stockées de manière sécurisée à l\'aide de Supabase. Nous prenons des mesures raisonnables pour protéger vos renseignements personnels contre la perte, le vol et l\'accès non autorisé. Votre `user_id` est stocké dans la table `audits` pour lier votre scan à votre compte.'
        },
        { 
          title: '6. Vos Droits (Loi 25)',
          body: 'En tant que résident du Québec, vous avez le droit de : \n- Accéder à vos renseignements personnels. \n- Rectifier (corriger) vos renseignements personnels. \n- Retirer votre consentement à tout moment. \n- Demander la suppression (désindexation) de vos informations. \nPour exercer ces droits, veuillez contacter notre Responsable de la protection de la vie privée.'
        },
        { 
          title: '7. Responsable de la protection de la vie privée',
          body: 'Nous avons désigné un Responsable de la protection de la vie privée pour superviser la conformité à cette politique.  \n\nAlejandro Monge \nResponsable de la protection de la vie privée \nalex@loi96facile'
        },
      ]
    }
  };

  return language === 'fr' ? content.fr : content.en;
};

export function PrivacyPolicy() {
  const texts = useLegalText();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg text-gray-700">
          <h1 className="text-3xl font-bold text-gray-900">{texts.title}</h1>
          <p className="text-sm text-gray-500">{texts.lastUpdated}</p>
        

          {texts.sections.map((section) => (
            <div key={section.title} className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
              <p style={{ whiteSpace: 'pre-line' }}>{section.body}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}