import { useAuditStore } from '../lib/store';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

// Bilingual content for Terms of Service
const useLegalText = () => {
  const language = useAuditStore((state) => state.language);

  const content = {
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last Updated: December 1, 2025',
      sections: [
        {
          title: '1. Agreement to Terms',
          body:
            'By accessing or using this tool, you agree to be bound by these Terms of Service. ' +
            'If you do not agree with these terms, you must not use the tool.'
        },
        {
          title: '2. Description of the Service',
          body:
            'This tool helps organizations and directors manage certain operational aspects of Bill S-211, including:\n' +
            '- Centralizing supplier and value-chain information\n' +
            '- Sending standardized requests or questionnaires\n' +
            '- Generating draft reports and statements to support S-211 disclosures\n\n' +
            'The service is provided for informational and operational support purposes only.'
        },
        {
          title: '3. Use of the Service',
          body:
            'You agree to use the tool only for lawful purposes and in accordance with these Terms. Specifically, you agree to:\n' +
            '- Provide accurate information to the best of your knowledge\n' +
            '- Not misuse the tool to send spam or abusive communications\n' +
            '- Not attempt to reverse-engineer, attack, or disrupt the service'
        },
        {
          title: '4. No Legal Advice & S-211 Compliance Disclaimer',
          body:
            'IMPORTANT: This tool is not a law firm and does not provide legal advice.\n\n' +
            'The outputs you receive (including drafts, templates, and reports) are generated for your convenience and may not be complete, accurate, or sufficient to meet all legal requirements. ' +
            'Use of this tool does not:\n' +
            '- Guarantee compliance with Bill S-211 or any other law\n' +
            '- Replace the need to consult qualified legal or compliance professionals\n\n' +
            'You remain solely responsible for reviewing all content and ensuring your organization meets its regulatory obligations.'
        },
        {
          title: '5. Limitation of Liability',
          body:
            'To the maximum extent permitted by applicable law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, ' +
            'or any loss of profits, revenues, data, or business opportunities, arising out of or in connection with your use of the tool or reliance on its outputs.\n\n' +
            'If our liability cannot be fully excluded, it will be limited to the maximum extent permitted by law.'
        },
        {
          title: '6. Data & Privacy',
          body:
            'Your use of the tool is also governed by our Privacy Policy, which explains how we collect, use, and protect your information. ' +
            'By using the tool, you acknowledge that you have reviewed the Privacy Policy and agree to its terms.'
        },
        {
          title: '7. Changes to the Service or Terms',
          body:
            'We may modify or discontinue aspects of the tool at any time, including features, functionality, or availability.\n\n' +
            'We may also update these Terms of Service from time to time. When we do, we will update the “Last Updated” date at the top of this page. ' +
            'Your continued use of the tool after changes are posted means you accept the updated terms.'
        },
        {
          title: '8. Governing Law',
          body:
            'These Terms are governed by the laws of Canada and the province or territory in which the service provider is established, without regard to conflict of law principles. ' +
            'Any disputes arising from these Terms or the use of the tool shall be subject to the exclusive jurisdiction of the courts located in that province or territory.'
        },
        {
          title: '9. Contact',
          body:
            'If you have questions about these Terms of Service, please contact:\n\n' +
            'Legal / Compliance Contact\n' +
            'Email: your-email@example.com'
        }
      ]
    },
    fr: {
      title: 'Conditions d’Utilisation',
      lastUpdated: 'Dernière mise à jour : 1 décembre 2025',
      sections: [
        {
          title: '1. Acceptation des Conditions',
          body:
            'En accédant à cet outil ou en l’utilisant, vous acceptez d’être lié par les présentes Conditions d’utilisation. ' +
            'Si vous n’êtes pas d’accord avec ces conditions, vous ne devez pas utiliser l’outil.'
        },
        {
          title: '2. Description du Service',
          body:
            'Cet outil aide les organisations et les administrateurs à gérer certains aspects opérationnels liés à la Loi S-211, notamment :\n' +
            '- La centralisation des informations sur les fournisseurs et la chaîne de valeur\n' +
            '- L’envoi de demandes ou questionnaires normalisés\n' +
            '- La génération de projets de rapports et d’énoncés pour soutenir les divulgations S-211\n\n' +
            'Le service est fourni uniquement à des fins informatives et de soutien opérationnel.'
        },
        {
          title: '3. Utilisation du Service',
          body:
            'Vous acceptez d’utiliser l’outil uniquement à des fins légales et conformément aux présentes Conditions. En particulier, vous acceptez de :\n' +
            '- Fournir des renseignements exacts au meilleur de votre connaissance\n' +
            '- Ne pas utiliser l’outil pour envoyer des communications abusives ou non sollicitées (spam)\n' +
            '- Ne pas tenter de désosser, attaquer ou perturber le service'
        },
        {
          title: '4. Absence de conseil juridique et avis de non-responsabilité S-211',
          body:
            'IMPORTANT : Cet outil n’est pas un cabinet d’avocats et ne fournit pas de conseil juridique.\n\n' +
            'Les résultats générés (y compris les projets, modèles et rapports) sont fournis pour vous simplifier le travail, mais ils peuvent ne pas être complets, exacts ou suffisants pour répondre à toutes les exigences légales. ' +
            'L’utilisation de l’outil ne :\n' +
            '- Garantit pas la conformité à la Loi S-211 ni à aucune autre loi\n' +
            '- Ne remplace pas la consultation de professionnels juridiques ou de conformité qualifiés\n\n' +
            'Vous demeurez seul responsable de la révision de tous les contenus générés et de la conformité de votre organisation à ses obligations réglementaires.'
        },
        {
          title: '5. Limitation de responsabilité',
          body:
            'Dans la mesure maximale permise par la loi applicable, nous ne pourrons être tenus responsables de tout dommage indirect, accessoire, spécial, consécutif ou punitif, ' +
            'ni de toute perte de profits, de revenus, de données ou d’occasions d’affaires, résultant de votre utilisation de l’outil ou de la confiance accordée à ses résultats.\n\n' +
            'Si notre responsabilité ne peut pas être entièrement exclue, elle sera limitée dans la mesure maximale permise par la loi.'
        },
        {
          title: '6. Données et vie privée',
          body:
            'Votre utilisation de l’outil est également régie par notre Politique de confidentialité, qui explique comment nous collectons, utilisons et protégeons vos renseignements. ' +
            'En utilisant l’outil, vous reconnaissez avoir pris connaissance de la Politique de confidentialité et accepter ses termes.'
        },
        {
          title: '7. Modifications du Service ou des Conditions',
          body:
            'Nous pouvons modifier ou interrompre certains aspects de l’outil en tout temps, y compris des fonctionnalités, la disponibilité ou certaines caractéristiques.\n\n' +
            'Nous pouvons également mettre à jour les présentes Conditions d’utilisation à l’avenir. Dans ce cas, nous mettrons à jour la date « Dernière mise à jour » au haut de cette page. ' +
            'Votre utilisation continue de l’outil après ces changements signifie que vous acceptez la nouvelle version des Conditions.'
        },
        {
          title: '8. Droit applicable',
          body:
            'Les présentes Conditions sont régies par les lois du Canada et de la province ou du territoire où le fournisseur de service est établi, sans égard aux règles de conflit de lois. ' +
            'Tout litige découlant des présentes Conditions ou de l’utilisation de l’outil sera soumis à la compétence exclusive des tribunaux situés dans cette province ou ce territoire.'
        },
        {
          title: '9. Contact',
          body:
            'Si vous avez des questions concernant ces Conditions d’utilisation, veuillez communiquer avec nous :\n\n' +
            'Contact juridique / conformité\n' +
            'Courriel : votre-courriel@example.com'
        }
      ]
    }
  };

  return language === 'fr' ? content.fr : content.en;
};

function TermsOfServiceInner() {
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
              <h2 className="text-2xl font-semibold text-gray-900">
                {section.title}
              </h2>
              <p style={{ whiteSpace: 'pre-line' }}>{section.body}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Named + default export
export function TermsOfService() {
  return <TermsOfServiceInner />;
}

export default TermsOfService;
