import { useAuditStore } from '../lib/store';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

// A simple bilingual text hook for this page
const useLegalText = () => {
  const language = useAuditStore((state) => state.language);
  
  const content = {
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last Updated: November 6, 2025',
      sections: [
        { 
          title: '1. Agreement to Terms',
          body: 'By using our service, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not use our service.'
        },
        { 
          title: '2. Description of Service',
          body: 'Quebec Compliance provides a compliance audit tool for informational purposes. \n- Free Scan: Provides an automated scan and a manual checklist to identify potential compliance gaps. \n- Premium Fix: For a one-time fee, provides AI-powered recommendations, templates, and code snippets to help fix identified gaps.'
        },
        { 
          title: '3. One-Time Payment',
          body: 'The Premium Compliance Fix is billed as a one-time charge. We are not a subscription service. All payments are processed by a secure third-party payment processor. By purchasing, you agree to their terms.'
        },
        { 
          title: '4. No Legal Advice Guarantee',
          body: 'IMPORTANT: Quebec Compliance is a technology tool, not a law firm. The information, scan results, and AI-generated content provided by our service do not constitute legal advice. We provide information and templates to help you, but we make no guarantee of full compliance. You are responsible for consulting with a qualified legal professional to ensure your business is fully compliant with Bill 96 and Law 25.'
        },
        { 
          title: '5. Accounts',
          body: 'When you create an account with us (by "claiming" your audit), you must provide information that is accurate and complete. You are responsible for safeguarding the password you use to access the service.'
        },
        { 
          title: '6. Limitation of Liability',
          body: 'To the maximum extent permitted by law, Quebec Compliance shall not be liable for any indirect, incidental, or consequential damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, or other intangible losses, resulting from your use of our service or your reliance on the information provided.'
        },
        { 
        title: '7. Governing Law',
        body: 'These Terms shall be governed and construed in accordance with the laws of the province of Quebec, Canada, without regard to its conflict of law provisions.'
        },
      ]
    },
    fr: {
      title: 'Conditions d\'Utilisation',
      lastUpdated: 'Dernière mise à jour : 6 novembre 2025',
      sections: [
        { 
          title: '1. Acceptation des Conditions',
          body: 'En utilisant notre service, vous acceptez d\'être lié par ces Conditions d\'Utilisation. Si vous n\'êtes pas d\'accord avec une partie des conditions, vous ne pouvez pas utiliser notre service.'
        },
        { 
          title: '2. Description du Service',
          body: 'Quebec Compliance fournit un outil d\'audit de conformité à des fins d\'information. \n- Scan Gratuit : Fournit un scan automatisé et une liste de vérification manuelle pour identifier les lacunes potentielles de conformité. \n- Correctif Premium : Pour un paiement unique, fournit des recommandations par IA, des modèles et des extraits de code pour aider à corriger les lacunes identifiées.'
        },
        { 
          title: '3. Paiement Unique',
          body: 'Le Correctif de Conformité Premium est facturé en tant que paiement unique. Nous ne sommes pas un service d\'abonnement. Tous les paiements sont traités par un processeur de paiement tiers sécurisé. En achetant, vous acceptez leurs conditions.'
        },
        { 
          title: '4. Aucune Garantie de Conseil Juridique',
          body: 'IMPORTANT : Quebec Compliance est un outil technologique, pas un cabinet d\'avocats. Les informations, résultats de scan et contenus générés par IA fournis par notre service ne constituent pas un avis juridique. Nous fournissons des informations et des modèles pour vous aider, mais nous ne garantissons pas une conformité totale. Vous êtes responsable de consulter un professionnel juridique qualifié pour vous assurer que votre entreprise est pleinement conforme à la Loi 96 et à la Loi 25.'
        },
        { 
          title: '5. Comptes',
          body: 'Lorsque vous créez un compte chez nous (en "réclamant" votre audit), vous devez fournir des informations exactes et complètes. Vous êtes responsable de la protection du mot de passe que vous utilisez pour accéder au service.'
        },
        { 
          title: '6. Limitation de Responsabilité',
          body: 'Dans la mesure maximale permise par la loi, Quebec Compliance ne sera pas responsable des dommages indirects, accessoires ou consécutifs, ou de toute perte de profits ou de revenus, qu\'elle soit encourue directement ou indirectement, ou de toute perte de données, d\'utilisation ou d\'autres pertes intangibles, résultant de votre utilisation de notre service ou de votre confiance dans les informations fournies.'
        },
        { 
        title: '7. Droit Applicable',
        body: 'Ces Conditions seront régies et interprétées conformément aux lois de la province de Québec, Canada, sans égard à ses dispositions relatives aux conflits de lois.'
        },
      ]
    }
  };

  return language === 'fr' ? content.fr : content.en;
};

export function TermsOfService() {
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