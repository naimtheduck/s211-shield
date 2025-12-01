import { useAuditStore } from '../lib/store';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

// Bilingual content for Privacy Policy
const useLegalText = () => {
  const language = useAuditStore((state) => state.language);

  const content = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last Updated: December 1, 2025',
      sections: [
        {
          title: '1. Introduction',
          body:
            'This tool is designed to help directors and compliance teams organize and generate documentation related to Bill S-211. ' +
            'We are committed to protecting the personal and business information you provide when using our service.'
        },
        {
          title: '2. Information We Collect',
          body:
            'When you use the tool, we may collect:\n' +
            '- Contact information (e.g., name, work email)\n' +
            '- Organization details (e.g., company name, sector)\n' +
            '- Supplier and value-chain information you choose to input\n' +
            '- Responses to S-211-related questionnaires and forms\n' +
            '- Generated reports and statements created through the tool'
        },
        {
          title: '3. How We Use Your Information',
          body:
            'We use the information you provide in order to:\n' +
            '- Generate draft S-211 support documents and reports\n' +
            '- Help you centralize supplier responses and documentation\n' +
            '- Improve and maintain the functionality, reliability, and security of the tool\n' +
            '- Communicate with you about service updates or issues'
        },
        {
          title: '4. Legal Advice & Compliance Disclaimer',
          body:
            'This tool does not provide legal advice and does not perform a legal compliance audit. ' +
            'Any report, template, or statement generated is for informational and operational support only. ' +
            'You remain fully responsible for reviewing all outputs and ensuring your organization complies with Bill S-211 and any other applicable laws.'
        },
        {
          title: '5. Data Storage & Security',
          body:
            'Your data is stored using modern cloud infrastructure and industry-standard security practices. ' +
            'We take reasonable measures to protect your information against unauthorized access, loss, or misuse. ' +
            'However, no system can be guaranteed to be 100% secure, and you understand this risk when using the tool.'
        },
        {
          title: '6. Sharing of Information',
          body:
            'We do not sell or trade your information.\n\n' +
            'We may share limited information with:\n' +
            '- Service providers (e.g., hosting, email delivery) strictly to operate the tool\n' +
            '- Authorities if required by law, regulation, or court order\n\n' +
            'Any third party we work with is expected to follow appropriate security and privacy practices.'
        },
        {
          title: '7. Your Choices & Rights',
          body:
            'Depending on your jurisdiction, you may have rights to access, correct, or request deletion of your personal information. ' +
            'You can also request that we stop using your information, subject to legal and contractual limits.\n\n' +
            'To exercise these rights or ask questions about your data, please contact us at the email address listed below.'
        },
        {
          title: '8. Contact',
          body:
            'If you have any questions about this Privacy Policy or how your data is handled, please contact:\n\n' +
            'Privacy Contact\n' +
            'Email: your-email@example.com'
        },
        {
          title: '9. Changes to this Policy',
          body:
            'We may update this Privacy Policy from time to time, for example to reflect changes in the tool, legal requirements, or best practices. ' +
            'If changes are material, we will update the “Last Updated” date at the top of this page. ' +
            'Your continued use of the tool after such changes means you accept the updated policy.'
        }
      ]
    },
    fr: {
      title: 'Politique de Confidentialité',
      lastUpdated: 'Dernière mise à jour : 1 décembre 2025',
      sections: [
        {
          title: '1. Introduction',
          body:
            'Cet outil est conçu pour aider les administrateurs et les équipes de conformité à organiser et à générer la documentation liée à la Loi S-211. ' +
            'Nous nous engageons à protéger les renseignements personnels et organisationnels que vous fournissez lors de l’utilisation du service.'
        },
        {
          title: '2. Renseignements que nous collectons',
          body:
            'Lorsque vous utilisez l’outil, nous pouvons collecter :\n' +
            '- Coordonnées (ex. : nom, courriel professionnel)\n' +
            '- Informations sur l’organisation (ex. : nom de l’entreprise, secteur)\n' +
            '- Informations sur les fournisseurs et la chaîne de valeur que vous saisissez\n' +
            '- Réponses aux questionnaires et formulaires liés à la Loi S-211\n' +
            '- Rapports et déclarations générés via l’outil'
        },
        {
          title: '3. Comment nous utilisons vos renseignements',
          body:
            'Nous utilisons les renseignements que vous fournissez afin de :\n' +
            '- Générer des projets de documents et rapports de soutien pour la Loi S-211\n' +
            '- Vous aider à centraliser les réponses et documents de vos fournisseurs\n' +
            '- Améliorer et maintenir les fonctionnalités, la fiabilité et la sécurité de l’outil\n' +
            '- Communiquer avec vous au sujet des mises à jour ou d’éventuels problèmes du service'
        },
        {
          title: '4. Avis concernant le conseil juridique et la conformité',
          body:
            'Cet outil ne fournit pas de conseil juridique et ne réalise pas d’audit de conformité juridique. ' +
            'Tout rapport, modèle ou énoncé généré est fourni uniquement à des fins informatives et opérationnelles. ' +
            'Vous demeurez entièrement responsable de la révision des contenus générés et de la conformité de votre organisation à la Loi S-211 et à toute autre loi applicable.'
        },
        {
          title: '5. Stockage et sécurité des données',
          body:
            'Vos données sont stockées à l’aide d’une infrastructure infonuagique moderne et de pratiques de sécurité reconnues dans l’industrie. ' +
            'Nous prenons des mesures raisonnables pour protéger vos renseignements contre l’accès non autorisé, la perte ou une utilisation abusive. ' +
            'Cependant, aucun système ne peut être garanti à 100 % sécurisé, et vous reconnaissez ce risque en utilisant l’outil.'
        },
        {
          title: '6. Partage des renseignements',
          body:
            'Nous ne vendons ni n’échangeons vos renseignements.\n\n' +
            'Nous pouvons partager certains renseignements limités avec :\n' +
            '- Des fournisseurs de services (ex. : hébergement, envoi de courriels) uniquement pour exploiter l’outil\n' +
            '- Des autorités si requis par la loi, un règlement ou une ordonnance du tribunal\n\n' +
            'Tout tiers avec lequel nous collaborons doit appliquer des pratiques de sécurité et de confidentialité appropriées.'
        },
        {
          title: '7. Vos choix et droits',
          body:
            'Selon votre juridiction, vous pouvez avoir le droit d’accéder à vos renseignements personnels, de les corriger ou d’en demander la suppression. ' +
            'Vous pouvez également demander que nous cessions d’utiliser vos renseignements, sous réserve de certaines limites légales ou contractuelles.\n\n' +
            'Pour exercer ces droits ou poser des questions concernant vos données, veuillez nous écrire à l’adresse ci-dessous.'
        },
        {
          title: '8. Contact',
          body:
            'Si vous avez des questions concernant cette Politique de confidentialité ou la façon dont vos données sont traitées, veuillez communiquer avec nous :\n\n' +
            'Personne-ressource à la vie privée\n' +
            'Courriel : votre-courriel@example.com'
        },
        {
          title: '9. Modifications à cette politique',
          body:
            'Nous pouvons mettre à jour cette Politique de confidentialité de temps à autre, par exemple pour refléter l’évolution de l’outil, des exigences légales ou des meilleures pratiques. ' +
            'En cas de modification importante, nous mettrons à jour la date « Dernière mise à jour » au haut de cette page. ' +
            'Votre utilisation continue de l’outil après ces changements signifie que vous acceptez la version mise à jour.'
        }
      ]
    }
  };

  return language === 'fr' ? content.fr : content.en;
};

function PrivacyPolicyInner() {
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

// Named + default export so you can use it as a page or as a component
export function PrivacyPolicy() {
  return <PrivacyPolicyInner />;
}

export default PrivacyPolicy;
