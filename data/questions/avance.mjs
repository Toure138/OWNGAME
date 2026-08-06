// Banque avancée — questions rédigées pour les paliers master et doctorat.
//
// Format d'un tuple : [énoncé, A, B, C, D, bonneRéponse, difficulté, explication, palier]
//
// Le neuvième élément est ici toujours renseigné, et c'est tout l'objet de ce
// fichier. Le classement automatique de `data/levels.mjs` répartit la banque par
// percentiles : il ordonne correctement les questions les unes par rapport aux
// autres, mais ne peut pas décider qu'une question relève du doctorat — le
// sommet de la pyramide reste à 7 % quoi qu'on ajoute. Les questions ci-dessous
// s'ajoutent donc directement à leur palier.
//
// Les tuples sont regroupés par identifiant de catégorie (`slug` dans
// `data/index.mjs`) et fusionnés avec les catégories existantes ; aucune
// nouvelle catégorie n'est créée.

export const AVANCE = {
  mathematiques: [
    ['Quelle propriété du groupe de Galois caractérise une équation polynomiale résoluble par radicaux ?', 'Il est abélien', 'Il est résoluble', 'Il est simple', 'Il est cyclique', 'B', 'H', 'Théorème de Galois : la résolubilité par radicaux équivaut à la résolubilité du groupe associé', 'DOCTORAT'],
    ['Que vaut l’intégrale de Gauss de e^(−x²) sur l’ensemble des réels ?', 'π', '√π', 'π/2', '2π', 'B', 'H', 'Le calcul en coordonnées polaires donne √π', 'MASTER'],
    ['Quel est le groupe fondamental du tore de dimension deux ?', 'Le groupe trivial', 'ℤ', 'ℤ²', 'ℤ/2ℤ', 'C', 'H', 'Le tore est un produit de deux cercles, et le groupe fondamental d’un produit est le produit des groupes', 'DOCTORAT'],
    ['Quelle hypothèse le théorème de Cauchy-Lipschitz exige-t-il pour garantir l’unicité locale d’une solution ?', 'La continuité seule', 'Le caractère lipschitzien par rapport à la variable d’état', 'La linéarité de l’équation', 'La bornitude de la solution', 'B', 'H', 'La continuité seule garantit l’existence (Peano), pas l’unicité', 'MASTER'],
    ['Comment nomme-t-on le plus grand des groupes simples sporadiques ?', 'Le groupe de Conway', 'Le Monstre', 'Le groupe de Mathieu', 'Le Bébé Monstre', 'B', 'H', 'Son ordre dépasse 8 × 10⁵³ éléments', 'DOCTORAT'],
    ['Dans un espace de Hilbert, que garantit le théorème de représentation de Riesz ?', 'Toute suite bornée converge', 'Toute forme linéaire continue s’écrit comme un produit scalaire', 'Toute base est dénombrable', 'Tout opérateur est borné', 'B', 'H', 'Le dual topologique d’un espace de Hilbert s’identifie à l’espace lui-même', 'MASTER'],
  ],

  physique: [
    ['Selon le théorème de Noether, quelle grandeur est conservée par l’invariance des lois physiques dans le temps ?', 'La quantité de mouvement', 'L’énergie', 'Le moment cinétique', 'La charge électrique', 'B', 'H', 'À chaque symétrie continue correspond une grandeur conservée : le temps donne l’énergie, l’espace la quantité de mouvement', 'MASTER'],
    ['De quelle façon la température de Hawking d’un trou noir de Schwarzschild varie-t-elle avec sa masse ?', 'Elle lui est proportionnelle', 'Elle lui est inversement proportionnelle', 'Elle varie comme son carré', 'Elle en est indépendante', 'B', 'H', 'Un trou noir léger est chaud et s’évapore vite ; un trou noir massif est très froid', 'DOCTORAT'],
    ['Quelle est la dimension de l’espace-temps dans les théories de supercordes ?', 'Quatre', 'Dix', 'Onze', 'Vingt-six', 'B', 'H', 'Les supercordes exigent dix dimensions ; la théorie M en compte onze et la corde bosonique vingt-six', 'DOCTORAT'],
    ['Quel serait le spin du graviton, boson hypothétique de l’interaction gravitationnelle ?', '0', '1', '2', '1/2', 'C', 'H', 'Le spin 2 découle du caractère tensoriel du champ gravitationnel', 'MASTER'],
    ['Que décrit le mécanisme de Brout-Englert-Higgs ?', 'La désintégration bêta', 'La brisure spontanée de la symétrie électrofaible', 'La confinement des quarks', 'L’oscillation des neutrinos', 'B', 'H', 'Il explique comment les bosons W et Z acquièrent une masse tandis que le photon reste sans masse', 'MASTER'],
    ['Dans la théorie BCS, quelle interaction lie les électrons en paires de Cooper ?', 'L’interaction coulombienne directe', 'L’interaction médiée par les phonons du réseau', 'L’interaction spin-orbite', 'L’interaction gravitationnelle', 'B', 'H', 'La déformation du réseau cristallin crée une attraction effective entre électrons malgré leur répulsion', 'DOCTORAT'],
  ],

  chimie: [
    ['Quelles règles prédisent la stéréochimie des réactions péricycliques à partir de la symétrie des orbitales ?', 'Les règles de Markovnikov', 'Les règles de Woodward-Hoffmann', 'Les règles de Hund', 'Les règles de Slater', 'B', 'H', 'Elles expliquent pourquoi une réaction électrocyclique est conrotatoire ou disrotatoire selon qu’elle est thermique ou photochimique', 'DOCTORAT'],
    ['Dans la théorie de Marcus, quelle grandeur gouverne la vitesse d’un transfert d’électron ?', 'La seule enthalpie libre', 'L’énergie de réorganisation', 'La force ionique', 'La tension de surface', 'B', 'H', 'Au-delà d’un certain point, augmenter la force motrice ralentit la réaction : c’est la région inverse de Marcus', 'DOCTORAT'],
    ['Que décrit le modèle de Dewar-Chatt-Duncanson ?', 'La liaison hydrogène', 'La liaison entre un métal de transition et un alcène', 'La liaison ionique', 'La liaison peptidique', 'B', 'H', 'Il combine une donation σ de l’alcène vers le métal et une rétrodonation π du métal vers l’alcène', 'DOCTORAT'],
    ['Que renseigne le déplacement chimique en spectroscopie RMN ?', 'La masse molaire', 'L’environnement électronique du noyau observé', 'Le point de fusion', 'La chiralité absolue', 'B', 'H', 'Le blindage produit par les électrons environnants décale la fréquence de résonance', 'MASTER'],
    ['Quelle grandeur thermodynamique reste constante lors d’une transformation isenthalpique comme la détente de Joule-Thomson ?', 'L’entropie', 'L’enthalpie', 'L’énergie interne', 'Le volume', 'B', 'H', 'Cette détente sert à liquéfier les gaz, le refroidissement dépendant du coefficient de Joule-Thomson', 'MASTER'],
  ],

  biologie: [
    ['Quel complexe ribonucléoprotéique assure l’épissage des ARN pré-messagers ?', 'Le ribosome', 'Le spliceosome', 'Le protéasome', 'Le nucléole', 'B', 'H', 'Il excise les introns et raboute les exons avant la traduction', 'MASTER'],
    ['Quel rôle joue la séquence PAM dans le système CRISPR-Cas9 ?', 'Elle code la protéine Cas9', 'Elle est indispensable à la reconnaissance de la cible par Cas9', 'Elle répare la coupure double brin', 'Elle transcrit l’ARN guide', 'B', 'H', 'Sans motif PAM adjacent, Cas9 ne coupe pas — c’est ce qui protège le génome bactérien de son propre système', 'DOCTORAT'],
    ['Que désigne l’épistasie en génétique ?', 'La mutation d’un seul nucléotide', 'L’interaction entre gènes situés à des locus différents', 'La duplication d’un chromosome', 'La transmission liée au sexe', 'B', 'H', 'L’effet d’un gène dépend alors du génotype à un autre locus', 'MASTER'],
    ['Quel mécanisme explique que des cellules génétiquement identiques expriment un même gène à des degrés différents ?', 'La dérive génétique', 'La stochasticité de l’expression génique', 'La recombinaison homologue', 'L’effet fondateur', 'B', 'H', 'Le faible nombre de molécules impliquées rend la transcription intrinsèquement bruitée', 'DOCTORAT'],
    ['Quelle enzyme permet aux rétrovirus de convertir leur ARN en ADN ?', 'L’ARN polymérase', 'La transcriptase inverse', 'La ligase', 'L’hélicase', 'B', 'H', 'Sa découverte a renversé le dogme central de la biologie moléculaire', 'MASTER'],
  ],

  informatique: [
    ['Que démontre le théorème de Rice ?', 'Que tout programme peut être optimisé', 'Que toute propriété non triviale des langages reconnus est indécidable', 'Que P est différent de NP', 'Que le tri exige n log n comparaisons', 'B', 'H', 'C’est une généralisation de l’indécidabilité du problème de l’arrêt', 'DOCTORAT'],
    ['Que garantit le théorème CAP à propos d’un système distribué ?', 'Les trois propriétés sont toujours atteignables', 'En cas de partition réseau, il faut choisir entre cohérence et disponibilité', 'La cohérence implique la disponibilité', 'La disponibilité impose la centralisation', 'B', 'H', 'La partition n’est pas un choix mais un fait du réseau : le vrai arbitrage se joue entre les deux autres propriétés', 'MASTER'],
    ['Quelle est la borne inférieure de complexité d’un tri fondé uniquement sur des comparaisons ?', 'Ω(n)', 'Ω(n log n)', 'Ω(n²)', 'Ω(log n)', 'B', 'H', 'L’arbre de décision associé compte n! feuilles, d’où une profondeur minimale en n log n', 'MASTER'],
    ['À quelle classe de complexité le problème SAT appartient-il historiquement ?', 'Premier problème prouvé NP-complet', 'Premier problème prouvé P', 'Premier problème prouvé indécidable', 'Premier problème prouvé PSPACE-complet', 'A', 'H', 'Le théorème de Cook-Levin en a fait le point de départ de la théorie de la NP-complétude', 'MASTER'],
    ['Que permet le protocole de consensus Raft dans un système réparti ?', 'De chiffrer les communications', 'De répliquer un journal de manière cohérente malgré des pannes', 'De compresser les données', 'D’équilibrer la charge réseau', 'B', 'H', 'Il vise la même garantie que Paxos, avec une formulation pensée pour être compréhensible', 'DOCTORAT'],
  ],

  ia: [
    ['Comment évolue le coût en mémoire de l’attention d’un Transformer avec la longueur de séquence ?', 'Linéairement', 'Quadratiquement', 'Logarithmiquement', 'Il en est indépendant', 'B', 'H', 'La matrice d’attention croise chaque position avec toutes les autres, d’où le coût en n²', 'MASTER'],
    ['Que décrit le phénomène de « double descente » en apprentissage statistique ?', 'L’erreur croît continûment avec la taille du modèle', 'L’erreur de test rediminue une fois passé le seuil d’interpolation', 'La descente de gradient converge deux fois', 'Le taux d’apprentissage doit être divisé par deux', 'B', 'H', 'Ce comportement contredit la lecture classique du compromis biais-variance', 'DOCTORAT'],
    ['Que fait le processus direct d’un modèle de diffusion ?', 'Il débruite l’image progressivement', 'Il ajoute progressivement du bruit gaussien aux données', 'Il compresse les données en un vecteur latent', 'Il classe les données par catégorie', 'B', 'H', 'L’apprentissage porte sur le processus inverse, qui apprend à retirer ce bruit', 'MASTER'],
    ['Quel terme la fonction de coût d’un auto-encodeur variationnel ajoute-t-elle à l’erreur de reconstruction ?', 'Une régularisation L1', 'Une divergence de Kullback-Leibler vers la loi a priori', 'Un terme de moment', 'Une pénalité de rang', 'B', 'H', 'Elle contraint la distribution latente à rester proche d’une gaussienne, rendant l’espace latent échantillonnable', 'DOCTORAT'],
    ['Quel problème l’algorithme d’optimisation de politique proximale (PPO) cherche-t-il à éviter ?', 'Le surapprentissage des données', 'Les mises à jour de politique trop brutales', 'La disparition du gradient', 'La fuite de données', 'B', 'H', 'Il borne le rapport entre ancienne et nouvelle politique pour stabiliser l’apprentissage par renforcement', 'DOCTORAT'],
  ],

  telecoms: [
    ['Que donne le théorème de Shannon-Hartley ?', 'La fréquence d’échantillonnage minimale', 'La capacité maximale d’un canal bruité en fonction de sa bande et du rapport signal sur bruit', 'La puissance d’émission optimale', 'Le taux de compression maximal', 'B', 'H', 'C = B log₂(1 + S/N) fixe une limite qu’aucun codage ne peut franchir', 'MASTER'],
    ['Quel procédé de modulation répartit l’information sur des sous-porteuses orthogonales ?', 'Le CDMA', 'L’OFDM', 'La modulation d’amplitude', 'Le saut de fréquence', 'B', 'H', 'L’orthogonalité permet de superposer les sous-porteuses sans interférence entre elles', 'MASTER'],
    ['Que vise le codage d’Alamouti dans un système à antennes multiples ?', 'Augmenter la bande passante', 'Exploiter la diversité spatiale à l’émission', 'Chiffrer la transmission', 'Réduire la consommation', 'B', 'H', 'Ce code spatio-temporel obtient une diversité d’ordre deux avec deux antennes d’émission et une seule de réception', 'DOCTORAT'],
    ['Quel phénomène limite la portée des communications en ondes millimétriques de la 5G ?', 'L’effet Doppler', 'La forte atténuation par les obstacles et l’atmosphère', 'La dispersion chromatique', 'La diaphonie', 'B', 'H', 'D’où le recours à des cellules de petite taille et à la formation de faisceaux', 'MASTER'],
  ],

  economie: [
    ['Que démontre le théorème d’impossibilité d’Arrow ?', 'Que le marché s’équilibre toujours', 'Qu’aucune règle de vote ne peut satisfaire simultanément un ensemble d’axiomes raisonnables', 'Que l’inflation suit le chômage', 'Que le libre-échange profite à tous', 'B', 'H', 'Au-delà de deux options, tout mode de scrutin doit renoncer à l’une des propriétés jugées souhaitables', 'DOCTORAT'],
    ['Qu’ajoute l’équilibre de Nash parfait en sous-jeux à l’équilibre de Nash ordinaire ?', 'Il suppose l’information imparfaite', 'Il exige que la stratégie reste optimale dans chaque sous-jeu', 'Il impose la coopération', 'Il interdit les stratégies mixtes', 'B', 'H', 'Ce raffinement élimine les équilibres reposant sur des menaces non crédibles', 'DOCTORAT'],
    ['Que postule la forme semi-forte de l’hypothèse d’efficience des marchés ?', 'Les prix ne reflètent que les cours passés', 'Les prix intègrent toute l’information publiquement disponible', 'Les prix intègrent aussi l’information privée', 'Les prix sont indépendants de l’information', 'B', 'H', 'Sous cette hypothèse, l’analyse fondamentale des données publiques ne procure aucun avantage durable', 'MASTER'],
    ['Que désigne l’aléa moral en économie de l’assurance ?', 'La sélection des meilleurs risques', 'Le changement de comportement d’un agent une fois couvert', 'L’erreur de tarification', 'La faillite de l’assureur', 'B', 'H', 'À distinguer de l’antisélection, qui joue avant la signature du contrat', 'MASTER'],
  ],

  sante: [
    ['Que vaut le rapport de vraisemblance positif d’un test diagnostique ?', 'Sensibilité / spécificité', 'Sensibilité / (1 − spécificité)', 'Spécificité / sensibilité', '(1 − sensibilité) / spécificité', 'B', 'H', 'Il mesure de combien un résultat positif fait pencher la probabilité de maladie, indépendamment de la prévalence', 'DOCTORAT'],
    ['Pourquoi la valeur prédictive positive d’un test chute-t-elle quand la maladie est rare ?', 'La sensibilité diminue', 'Les faux positifs deviennent majoritaires parmi les résultats positifs', 'La spécificité diminue', 'Le test devient moins reproductible', 'B', 'H', 'Même un test très spécifique produit plus de faux positifs que de vrais positifs en population peu touchée', 'MASTER'],
    ['Que garantit la randomisation dans un essai clinique contrôlé ?', 'L’absence d’effet placebo', 'La comparabilité des groupes sur les facteurs de confusion, y compris inconnus', 'Un échantillon plus grand', 'L’absence de perdus de vue', 'B', 'H', 'C’est ce qui distingue l’essai randomisé des études observationnelles', 'MASTER'],
    ['Que décrit la pharmacocinétique d’ordre zéro ?', 'Une élimination proportionnelle à la concentration', 'Une élimination à vitesse constante, indépendante de la concentration', 'Une absorption instantanée', 'Une distribution homogène', 'B', 'H', 'C’est le cas de l’éthanol, dont l’élimination sature les enzymes hépatiques', 'DOCTORAT'],
  ],

  histoire: [
    ['Quelle école historiographique fondée en 1929 privilégie l’histoire des structures et la longue durée ?', 'L’école méthodique', 'L’école des Annales', 'L’école de Francfort', 'L’école de Chicago', 'B', 'H', 'Fondée par Marc Bloch et Lucien Febvre, elle déplace l’attention de l’événement vers les structures sociales et économiques', 'MASTER'],
    ['Que désigne le concept de « biopouvoir » chez Michel Foucault ?', 'La censure des publications', 'L’exercice du pouvoir sur la vie et la gestion des populations', 'Le monopole de la violence légitime', 'La séparation des pouvoirs', 'B', 'H', 'Il décrit un pouvoir qui administre la natalité, la santé et la longévité plutôt qu’il ne prononce la mort', 'DOCTORAT'],
  ],

  politique: [
    ['Comment Max Weber définit-il l’État moderne ?', 'Par son territoire', 'Par le monopole de la violence physique légitime', 'Par sa constitution écrite', 'Par le suffrage universel', 'B', 'H', 'Définition posée dans « Le savant et le politique »', 'MASTER'],
    ['Que désigne le « dilemme de sécurité » en relations internationales ?', 'Le choix entre défense et économie', 'Le fait que les mesures défensives d’un État soient perçues comme menaçantes par les autres', 'L’impossibilité de signer un traité', 'La dépendance énergétique', 'B', 'H', 'Chaque État renforce sa sécurité et diminue, ce faisant, celle de ses voisins — d’où la spirale des armements', 'DOCTORAT'],
  ],

  litterature: [
    ['Quelle thèse Roland Barthes défend-il dans « La mort de l’auteur » ?', 'L’auteur est le seul garant du sens', 'Le sens se construit à la lecture, non dans l’intention de l’auteur', 'La littérature doit être engagée', 'Le roman est un genre dépassé', 'B', 'H', 'Ce texte de 1967 déplace l’autorité interprétative de l’écrivain vers le lecteur', 'MASTER'],
    ['Que désigne l’intertextualité, notion forgée par Julia Kristeva ?', 'La traduction d’une œuvre', 'La présence d’un texte dans un autre, par citation, allusion ou transformation', 'La critique biographique', 'La censure éditoriale', 'B', 'H', 'La notion prolonge le dialogisme de Bakhtine', 'DOCTORAT'],
  ],

  environnement: [
    ['Que mesure le forçage radiatif d’un gaz à effet de serre ?', 'Sa durée de vie atmosphérique', 'La perturbation du bilan énergétique terrestre qu’il provoque, en watts par mètre carré', 'Sa concentration en parties par million', 'Sa toxicité', 'B', 'H', 'C’est la grandeur qui permet de comparer l’effet climatique de gaz très différents', 'MASTER'],
    ['Que désigne un point de bascule dans le système climatique ?', 'Le pic annuel de température', 'Un seuil au-delà duquel un changement s’auto-entretient et devient difficilement réversible', 'La moyenne sur trente ans', 'L’équinoxe', 'B', 'H', 'La fonte du permafrost et le dépérissement de l’Amazonie en sont des exemples étudiés', 'DOCTORAT'],
  ],

  'sciences-terre': [
    ['Que mesure la magnitude de moment d’un séisme ?', 'L’intensité ressentie en surface', 'L’énergie libérée à partir du moment sismique', 'La profondeur de l’hypocentre', 'La durée des secousses', 'B', 'H', 'Contrairement à l’échelle de Richter, elle ne sature pas pour les très grands séismes', 'MASTER'],
    ['Que révèle la discontinuité de Gutenberg à environ 2 900 km de profondeur ?', 'La limite croûte-manteau', 'La limite manteau-noyau externe', 'La limite noyau externe-graine', 'La base de la lithosphère', 'B', 'H', 'Les ondes S, qui ne se propagent pas dans les liquides, s’y arrêtent : c’est ainsi qu’on sait le noyau externe fluide', 'DOCTORAT'],
  ],
}
