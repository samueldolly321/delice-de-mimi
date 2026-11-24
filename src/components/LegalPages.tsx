import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { openCookieSettings } from '../utils/analytics';

/**
 * Pages légales : confidentialité, conditions générales de vente, mentions légales.
 * Les informations du restaurant (nom, adresse, NIF, STAT…) viennent des paramètres
 * saisis dans l'administration : elles restent à jour automatiquement.
 *
 * Ces textes sont un modèle sérieux mais ne remplacent pas l'avis d'un juriste.
 */

export type LegalPageKind = 'confidentialite' | 'conditions-generales' | 'mentions-legales';

const TITLES: Record<LegalPageKind, string> = {
  confidentialite: 'Politique de confidentialité',
  'conditions-generales': 'Conditions générales de vente',
  'mentions-legales': 'Mentions légales',
};

const LAST_UPDATE = '24 novembre 2026';

const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="mt-12 mb-4 label-caps text-[14px] text-ink">{children}</h2>
);

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mt-3 text-[15px] text-stone-600 leading-[1.8]">{children}</p>
);

const UL: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <ul className="mt-3 space-y-2 text-[15px] text-stone-600 leading-[1.7] list-disc pl-5">
    {items.map((it, i) => (
      <li key={i}>{it}</li>
    ))}
  </ul>
);

export const LegalPage: React.FC<{ kind: LegalPageKind }> = ({ kind }) => {
  const { settings, formatPrice } = useCart();
  const name = settings.name || 'Les Délices de Mimi';
  const email = settings.email || '';
  const contactLine = [settings.phone, email].filter(Boolean).join(' · ');

  useEffect(() => {
    document.title = `${TITLES[kind]} | ${name}`;
    window.scrollTo(0, 0);
  }, [kind, name]);

  const identity = (
    <UL
      items={[
        <>
          <strong className="text-ink">{name}</strong>
          {settings.tagline ? ` — ${settings.tagline}` : ''}
        </>,
        <>Adresse : {settings.address || 'Antananarivo, Madagascar'}, Antananarivo, Madagascar</>,
        contactLine && <>Contact : {contactLine}</>,
        settings.nifNumber && <>NIF : {settings.nifNumber}</>,
        settings.statNumber && <>STAT : {settings.statNumber}</>,
        settings.rcsNumber && <>{settings.rcsNumber}</>,
      ].filter(Boolean)}
    />
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* En-tête simple */}
      <header className="border-b border-hairline">
        <div className="max-w-[1180px] mx-auto px-6 sm:px-10 py-5 flex items-center justify-between gap-4">
          <a href="/" className="font-display uppercase tracking-[0.14em] text-lg text-ink">
            {name}
          </a>
          <a href="/" className="flex items-center gap-2 label-caps text-[11px] text-stone-500 hover:text-ink">
            <ArrowLeft className="w-4 h-4" /> Retour au site
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 sm:px-10 py-16 md:py-20">
        <h1 className="section-title text-xl sm:text-2xl">{TITLES[kind]}</h1>
        <p className="mt-6 text-center text-[13px] text-stone-400">Dernière mise à jour : {LAST_UPDATE}</p>

        {kind === 'mentions-legales' && (
          <>
            <H2>Éditeur du site</H2>
            {identity}
            <P>Responsable de la publication : la gérance de {name}, joignable aux coordonnées ci-dessus.</P>

            <H2>Hébergement</H2>
            <P>
              Le site est hébergé par Render Services, Inc., San Francisco, Californie, États-Unis —{' '}
              <a className="underline" href="https://render.com" target="_blank" rel="noreferrer">
                render.com
              </a>
              .
            </P>

            <H2>Propriété intellectuelle</H2>
            <P>
              Les textes, le logo, la charte graphique et les photographies propres à {name} sont protégés. Toute
              reproduction sans autorisation écrite est interdite. Certaines photographies d'illustration proviennent de
              banques d'images libres de droits (Unsplash).
            </P>

            <H2>Données personnelles et cookies</H2>
            <P>
              Voir notre{' '}
              <a className="underline" href="/confidentialite">
                politique de confidentialité
              </a>
              .
            </P>
          </>
        )}

        {kind === 'confidentialite' && (
          <>
            <P>
              {name} attache une grande importance à la protection de vos données personnelles. Cette page explique
              quelles données nous collectons, pourquoi, combien de temps nous les gardons et quels sont vos droits,
              conformément à la loi malgache n° 2014-038 sur la protection des données à caractère personnel.
            </P>

            <H2>Responsable du traitement</H2>
            {identity}

            <H2>Données collectées</H2>
            <UL
              items={[
                <>
                  <strong className="text-ink">Compte client :</strong> nom, téléphone, email, adresse et quartier de
                  livraison, mot de passe et réponse à la question de sécurité (enregistrés uniquement sous forme chiffrée).
                </>,
                <>
                  <strong className="text-ink">Commandes :</strong> plats commandés, montant, mode de livraison et de
                  paiement, date.
                </>,
                <>
                  <strong className="text-ink">Formulaire de contact et réservations :</strong> nom, téléphone et/ou email,
                  date et nombre de personnes, votre message.
                </>,
                <>
                  <strong className="text-ink">Mesure d'audience (seulement avec votre accord) :</strong> pages vues, type
                  d'appareil, ville approximative, de façon anonymisée.
                </>,
              ]}
            />

            <H2>Pourquoi nous les utilisons</H2>
            <UL
              items={[
                'Préparer, livrer et suivre vos commandes, et vous contacter à leur sujet.',
                'Gérer votre compte client et votre programme de fidélité.',
                'Répondre à vos messages et confirmer vos réservations.',
                'Respecter nos obligations comptables et fiscales.',
                "Améliorer le site grâce aux statistiques de visite, uniquement si vous l'avez accepté.",
              ]}
            />
            <P>Nous ne vendons jamais vos données et ne les utilisons pas pour de la publicité ciblée.</P>

            <H2>Qui y a accès</H2>
            <UL
              items={[
                "L'équipe du restaurant, pour traiter vos commandes et vos demandes.",
                "Notre hébergeur (Render, États-Unis), qui stocke le site et sa base de données de façon sécurisée.",
                'Notre service d’envoi d’emails, pour les notifications de commande.',
                "Google (Analytics), uniquement si vous avez accepté la mesure d'audience.",
              ]}
            />

            <H2>Durée de conservation</H2>
            <UL
              items={[
                'Compte client : tant que le compte est actif, puis supprimé sur simple demande.',
                'Commandes : pendant la durée imposée par nos obligations comptables et fiscales.',
                'Messages et réservations : 2 ans maximum après le dernier échange.',
                "Choix concernant les cookies : 13 mois, après quoi la question vous est reposée.",
              ]}
            />

            <H2>Cookies et stockage dans votre navigateur</H2>
            <P>
              Le site enregistre dans votre navigateur uniquement ce qui est indispensable à son fonctionnement : votre
              panier et votre session de connexion. Ces éléments ne nécessitent pas d'accord.
            </P>
            <P>
              La mesure d'audience (Google Analytics) n'est activée que si vous cliquez sur « Accepter » dans le bandeau.
              Vous pouvez changer d'avis à tout moment :{' '}
              <button type="button" onClick={openCookieSettings} className="underline text-ink cursor-pointer">
                gérer mes cookies
              </button>
              .
            </P>

            <H2>Sécurité</H2>
            <P>
              Le site est accessible uniquement en HTTPS (connexion chiffrée). Les mots de passe sont chiffrés et
              l'accès à l'administration est protégé.
            </P>

            <H2>Vos droits</H2>
            <P>
              Vous pouvez à tout moment demander l'accès à vos données, leur correction, leur suppression ou vous
              opposer à leur utilisation, en nous écrivant{email ? ` à ${email}` : ''} ou par téléphone
              {settings.phone ? ` au ${settings.phone}` : ''}. Nous répondons dans un délai d'un mois. Vous pouvez
              aussi saisir la Commission Malagasy de l'Informatique et des Libertés (CMIL).
            </P>
          </>
        )}

        {kind === 'conditions-generales' && (
          <>
            <P>
              Les présentes conditions s'appliquent à toute commande passée sur le site de {name}. Passer commande
              implique leur acceptation.
            </P>

            <H2>1. Vendeur</H2>
            {identity}

            <H2>2. Commandes</H2>
            <P>
              Les commandes se passent en ligne après création d'un compte client. La commande est enregistrée après
              validation du panier ; le restaurant la confirme par téléphone, WhatsApp ou email. Le restaurant peut
              refuser ou annuler une commande en cas d'indisponibilité d'un plat, d'informations incomplètes ou
              d'adresse hors zone de livraison ; le client en est alors informé sans délai.
            </P>
            {settings.openingHours && <P>Horaires de commande : {settings.openingHours}.</P>}

            <H2>3. Prix</H2>
            <P>
              Les prix sont indiqués en Ariary (Ar), toutes taxes comprises. Le prix appliqué est celui affiché au moment
              de la commande ; le montant final est recalculé et confirmé par notre serveur. Les frais de livraison
              {settings.deliveryFee ? ` (à partir de ${formatPrice(settings.deliveryFee)})` : ''} sont indiqués avant la
              validation
              {settings.freeDeliveryThreshold
                ? `, et offerts à partir de ${formatPrice(settings.freeDeliveryThreshold)} de commande`
                : ''}
              .
            </P>

            <H2>4. Paiement</H2>
            <UL
              items={[
                'En espèces à la livraison.',
                'Sur place, au moment du retrait.',
                'Par Mobile Money, selon les instructions communiquées par le restaurant.',
              ]}
            />
            <P>Aucune donnée bancaire n'est demandée ni enregistrée sur le site.</P>

            <H2>5. Livraison et retrait</H2>
            <P>
              La livraison est assurée à Antananarivo, dans les quartiers desservis. Les délais indiqués sont donnés à
              titre indicatif et peuvent varier selon l'affluence et la circulation. Pour un retrait sur place, la
              commande est à récupérer au restaurant à l'heure convenue. Le client doit être joignable au numéro indiqué.
            </P>

            <H2>6. Annulation</H2>
            <P>
              Les plats étant préparés à la minute, une commande ne peut plus être annulée une fois sa préparation
              commencée. Pour toute annulation avant ce moment, contactez-nous au plus vite
              {settings.phone ? ` au ${settings.phone}` : ''}.
            </P>

            <H2>7. Réclamations</H2>
            <P>
              En cas de problème (plat manquant, erreur, qualité), signalez-le-nous dans les 24 heures avec votre numéro
              de commande. Nous chercherons une solution adaptée : remplacement, avoir ou remboursement.
            </P>

            <H2>8. Allergènes</H2>
            <P>
              Nos plats peuvent contenir ou avoir été en contact avec des allergènes (gluten, crustacés, œufs, poisson,
              arachides, soja, sésame…). En cas d'allergie, précisez-le dans votre commande ou contactez-nous avant de
              commander.
            </P>

            <H2>9. Données personnelles</H2>
            <P>
              Les données transmises lors de la commande sont traitées selon notre{' '}
              <a className="underline" href="/confidentialite">
                politique de confidentialité
              </a>
              .
            </P>

            <H2>10. Droit applicable</H2>
            <P>
              Les présentes conditions sont soumises au droit malgache. En cas de litige, une solution amiable sera
              recherchée en priorité ; à défaut, les tribunaux d'Antananarivo seront compétents.
            </P>
          </>
        )}
      </main>

      <LegalFooter />
    </div>
  );
};

/** Liens légaux réutilisés en bas des pages légales et de la page 404. */
export const LegalFooter: React.FC = () => {
  const { settings } = useCart();
  return (
    <footer className="bg-[#111111] text-white/60">
      <div className="max-w-[1180px] mx-auto px-6 sm:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px]">
        <span>
          © {new Date().getFullYear()} {settings.name}
        </span>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <a href="/mentions-legales" className="hover:text-white">
            Mentions légales
          </a>
          <a href="/conditions-generales" className="hover:text-white">
            CGV
          </a>
          <a href="/confidentialite" className="hover:text-white">
            Confidentialité
          </a>
        </nav>
      </div>
    </footer>
  );
};
