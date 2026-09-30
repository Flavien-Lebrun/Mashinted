/**
 * @file locales.js
 * @brief UI strings per language. English is the reference and the fallback.
 * @details A value is a string, or a function of the params passed to `t()` (used
 *          for plurals and interpolation). Values are plain text: escape them
 *          (`escapeHtml`) before handing them to `innerHTML`.
 */

export const DEFAULT_LANGUAGE = 'en';

const en = {
    widgetFiltering: 'Filtering...',
    // Counter widget
    widgetBlocked: 'Blocked:',
    trashTitle: 'Block this brand',

    // Blacklist modal
    modalSearchPlaceholder: 'Search or block a brand...',
    modalClose: 'Close',
    modalCloseLabel: 'Close UI',
    modalBrandsBlocked: 'Brands Blocked',
    modalEmpty: 'No blacklisted brands yet.',
    modalBlockBrand: ({ name }) => `Block "${name}"`,
    modalAddLabel: 'Add to blacklist',

    // Item card
    addToFavourites: 'Add to favourites',
    favourite: 'Favourite',
    favouriteAdded: 'Added! ',
    removeFromFavourites: ({ count }) =>
        `Remove from favourites, favourited by ${count} user${count > 1 ? 's' : ''}`,
    priceIncl: 'incl.',
    priceIncludesProtection: ({ price }) => `${price} includes Buyer Protection`,
    itemCount: ({ count }) => `${count} item${count > 1 ? 's' : ''}`,
    toggleSection: 'Toggle section',
    viewSearch: 'View this search on Vinted',

    // Aggregator
    aggregatorTitle: "Discover what you've missed",
    aggregatorLabel: ({ total, breakdown }) => `Discover what you've missed ${total} ${breakdown}`,
    upToDate: "You're up to date",
    defaultSearchName: 'Search',
    infoLoadingLabel: 'Loading limitations info',
    infoLimitsLabel: 'Information about loading limits',
    loadButton: 'Load New Arrivals',
    tooltipTitle: 'New items aggregator',
    tooltipDesc: 'This button has the purpose of displaying all the new items from your saved searches.',
    tooltipLimits: 'To optimize performance and avoid rate limits, loading limits are applied:',
    tooltipUnderCapLabel: 'Total ≤ 99 items:',
    tooltipUnderCapText: 'All new items are fetched.',
    tooltipOverCapLabel: 'Total > 99 items:',
    tooltipOverCapBefore: 'Automatically capped at',
    tooltipOverCapBold: '30 items max',
    tooltipOverCapAfter: 'per search.',
    progressInitial: 'Initiating aggregation...',
    progressDefault: 'Aggregating in progress...',
    progressBadge: 'In progress',
    progressClearing: 'Clearing current feed...',
    progressLoading: ({ index, total, count, name }) =>
        `Loading (${index}/${total}): ${count} item(s) from "${name}"...`,
    progressComplete: 'Aggregation complete',
    progressInjected: ({ count }) => `${count} listings injected successfully!`,
    progressBadgeComplete: 'Complete',
    progressError: ({ message }) => `❌ Error: ${message}`,
    aggregationFailed: 'Aggregation failed',

    // Favourites page
    sectionSold: 'Sold',
    sectionAvailable: 'Available',
    deleteAllSold: 'Delete all sold',
    /** Lowercase word Vinted prints on a sold card (fallback when no status element). */
    soldKeyword: 'sold',

    // Inbox
    inboxOpenUnread: ({ count }) => `Open unread (${count})`,
    inboxStop: ({ done, total }) => `Stop (${done}/${total})`,
};

const fr = {
    widgetFiltering: 'Filtrage...',
    widgetBlocked: 'Bloqués :',
    trashTitle: 'Bloquer cette marque',

    modalSearchPlaceholder: 'Rechercher ou bloquer une marque...',
    modalClose: 'Fermer',
    modalCloseLabel: "Fermer l'interface",
    modalBrandsBlocked: 'Marques bloquées',
    modalEmpty: 'Aucune marque bloquée pour le moment.',
    modalBlockBrand: ({ name }) => `Bloquer « ${name} »`,
    modalAddLabel: 'Ajouter à la liste noire',

    addToFavourites: 'Ajouter aux favoris',
    favourite: 'Favoris',
    favouriteAdded: 'Ajouté ! ',
    removeFromFavourites: ({ count }) =>
        `Supprimer des favoris, ajouté aux favoris par ${count} utilisateur${count > 1 ? 's' : ''}`,
    priceIncl: 'incl.',
    priceIncludesProtection: ({ price }) => `${price} comprend la Protection acheteurs`,
    itemCount: ({ count }) => `${count} article${count > 1 ? 's' : ''}`,
    toggleSection: 'Afficher / masquer la section',
    viewSearch: 'Voir cette recherche sur Vinted',

    aggregatorTitle: 'Découvrez ce que vous avez manqué',
    aggregatorLabel: ({ total, breakdown }) => `Découvrez ce que vous avez manqué ${total} ${breakdown}`,
    upToDate: 'Vous êtes à jour',
    defaultSearchName: 'Recherche',
    infoLoadingLabel: 'Informations sur les limites de chargement',
    infoLimitsLabel: 'Informations sur les limites de chargement',
    loadButton: 'Charger les nouveautés',
    tooltipTitle: 'Agrégateur de nouveautés',
    tooltipDesc: 'Ce bouton affiche toutes les nouveautés de vos recherches sauvegardées.',
    tooltipLimits: 'Pour optimiser les performances et éviter les limitations, des plafonds de chargement s’appliquent :',
    tooltipUnderCapLabel: 'Total ≤ 99 articles :',
    tooltipUnderCapText: 'Toutes les nouveautés sont chargées.',
    tooltipOverCapLabel: 'Total > 99 articles :',
    tooltipOverCapBefore: 'Plafonné automatiquement à',
    tooltipOverCapBold: '30 articles maximum',
    tooltipOverCapAfter: 'par recherche.',
    progressInitial: "Démarrage de l'agrégation...",
    progressDefault: 'Agrégation en cours...',
    progressBadge: 'En cours',
    progressClearing: 'Nettoyage du fil actuel...',
    progressLoading: ({ index, total, count, name }) =>
        `Chargement (${index}/${total}) : ${count} article(s) de « ${name} »...`,
    progressComplete: 'Agrégation terminée',
    progressInjected: ({ count }) => `${count} annonces ajoutées avec succès !`,
    progressBadgeComplete: 'Terminé',
    progressError: ({ message }) => `❌ Erreur : ${message}`,
    aggregationFailed: "Échec de l'agrégation",

    sectionSold: 'Vendus',
    sectionAvailable: 'Disponibles',
    deleteAllSold: 'Supprimer tous les vendus',
    soldKeyword: 'vendu',

    inboxOpenUnread: ({ count }) => `Ouvrir les non lues (${count})`,
    inboxStop: ({ done, total }) => `Arrêter (${done}/${total})`,
};

const es = {
    widgetFiltering: 'Filtrando...',
    widgetBlocked: 'Bloqueadas:',
    trashTitle: 'Bloquear esta marca',

    modalSearchPlaceholder: 'Buscar o bloquear una marca...',
    modalClose: 'Cerrar',
    modalCloseLabel: 'Cerrar interfaz',
    modalBrandsBlocked: 'Marcas bloqueadas',
    modalEmpty: 'Aún no hay marcas bloqueadas.',
    modalBlockBrand: ({ name }) => `Bloquear "${name}"`,
    modalAddLabel: 'Añadir a la lista negra',

    addToFavourites: 'Añadir a favoritos',
    favourite: 'Favoritos',
    favouriteAdded: '¡Añadido! ',
    removeFromFavourites: ({ count }) =>
        `Quitar de favoritos, añadido a favoritos por ${count} usuario${count > 1 ? 's' : ''}`,
    priceIncl: 'incl.',
    priceIncludesProtection: ({ price }) => `${price} incluye la Protección del comprador`,
    itemCount: ({ count }) => `${count} artículo${count > 1 ? 's' : ''}`,
    toggleSection: 'Mostrar u ocultar sección',
    viewSearch: 'Ver esta búsqueda en Vinted',

    aggregatorTitle: 'Descubre lo que te has perdido',
    aggregatorLabel: ({ total, breakdown }) => `Descubre lo que te has perdido ${total} ${breakdown}`,
    upToDate: 'Estás al día',
    defaultSearchName: 'Búsqueda',
    infoLoadingLabel: 'Información sobre los límites de carga',
    infoLimitsLabel: 'Información sobre los límites de carga',
    loadButton: 'Cargar novedades',
    tooltipTitle: 'Agregador de novedades',
    tooltipDesc: 'Este botón muestra todas las novedades de tus búsquedas guardadas.',
    tooltipLimits: 'Para optimizar el rendimiento y evitar límites de peticiones, se aplican límites de carga:',
    tooltipUnderCapLabel: 'Total ≤ 99 artículos:',
    tooltipUnderCapText: 'Se cargan todas las novedades.',
    tooltipOverCapLabel: 'Total > 99 artículos:',
    tooltipOverCapBefore: 'Se limita automáticamente a',
    tooltipOverCapBold: '30 artículos como máximo',
    tooltipOverCapAfter: 'por búsqueda.',
    progressInitial: 'Iniciando la agregación...',
    progressDefault: 'Agregación en curso...',
    progressBadge: 'En curso',
    progressClearing: 'Limpiando el feed actual...',
    progressLoading: ({ index, total, count, name }) =>
        `Cargando (${index}/${total}): ${count} artículo(s) de "${name}"...`,
    progressComplete: 'Agregación completada',
    progressInjected: ({ count }) => `¡${count} anuncios añadidos con éxito!`,
    progressBadgeComplete: 'Completado',
    progressError: ({ message }) => `❌ Error: ${message}`,
    aggregationFailed: 'Error en la agregación',

    sectionSold: 'Vendidos',
    sectionAvailable: 'Disponibles',
    deleteAllSold: 'Eliminar todos los vendidos',
    soldKeyword: 'vendido',

    inboxOpenUnread: ({ count }) => `Abrir no leídas (${count})`,
    inboxStop: ({ done, total }) => `Detener (${done}/${total})`,
};

const nl = {
    widgetFiltering: 'Filteren...',
    widgetBlocked: 'Geblokkeerd:',
    trashTitle: 'Dit merk blokkeren',

    modalSearchPlaceholder: 'Zoek of blokkeer een merk...',
    modalClose: 'Sluiten',
    modalCloseLabel: 'Venster sluiten',
    modalBrandsBlocked: 'Geblokkeerde merken',
    modalEmpty: 'Nog geen geblokkeerde merken.',
    modalBlockBrand: ({ name }) => `Blokkeer "${name}"`,
    modalAddLabel: 'Toevoegen aan zwarte lijst',

    addToFavourites: 'Toevoegen aan favorieten',
    favourite: 'Favoriet',
    favouriteAdded: 'Toegevoegd! ',
    removeFromFavourites: ({ count }) =>
        `Verwijderen uit favorieten, favoriet van ${count} gebruiker${count > 1 ? 's' : ''}`,
    priceIncl: 'incl.',
    priceIncludesProtection: ({ price }) => `${price} inclusief Kopersbescherming`,
    itemCount: ({ count }) => `${count} artikel${count > 1 ? 'en' : ''}`,
    toggleSection: 'Sectie in- of uitklappen',
    viewSearch: 'Bekijk deze zoekopdracht op Vinted',

    aggregatorTitle: 'Ontdek wat je gemist hebt',
    aggregatorLabel: ({ total, breakdown }) => `Ontdek wat je gemist hebt ${total} ${breakdown}`,
    upToDate: 'Je bent bij',
    defaultSearchName: 'Zoekopdracht',
    infoLoadingLabel: 'Informatie over laadlimieten',
    infoLimitsLabel: 'Informatie over laadlimieten',
    loadButton: 'Nieuwe artikelen laden',
    tooltipTitle: 'Aggregator voor nieuwe artikelen',
    tooltipDesc: 'Deze knop toont alle nieuwe artikelen uit je opgeslagen zoekopdrachten.',
    tooltipLimits: 'Om de prestaties te optimaliseren en limieten te vermijden, gelden er laadlimieten:',
    tooltipUnderCapLabel: 'Totaal ≤ 99 artikelen:',
    tooltipUnderCapText: 'Alle nieuwe artikelen worden geladen.',
    tooltipOverCapLabel: 'Totaal > 99 artikelen:',
    tooltipOverCapBefore: 'Automatisch beperkt tot',
    tooltipOverCapBold: 'maximaal 30 artikelen',
    tooltipOverCapAfter: 'per zoekopdracht.',
    progressInitial: 'Aggregatie starten...',
    progressDefault: 'Aggregatie bezig...',
    progressBadge: 'Bezig',
    progressClearing: 'Huidige feed wissen...',
    progressLoading: ({ index, total, count, name }) =>
        `Laden (${index}/${total}): ${count} artikel(en) van "${name}"...`,
    progressComplete: 'Aggregatie voltooid',
    progressInjected: ({ count }) => `${count} advertenties succesvol toegevoegd!`,
    progressBadgeComplete: 'Voltooid',
    progressError: ({ message }) => `❌ Fout: ${message}`,
    aggregationFailed: 'Aggregatie mislukt',

    sectionSold: 'Verkocht',
    sectionAvailable: 'Beschikbaar',
    deleteAllSold: 'Alle verkochte verwijderen',
    soldKeyword: 'verkocht',

    inboxOpenUnread: ({ count }) => `Ongelezen openen (${count})`,
    inboxStop: ({ done, total }) => `Stoppen (${done}/${total})`,
};

export const LOCALES = { en, fr, es, nl };
