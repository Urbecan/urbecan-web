// Completa la traducción española de Decap (algunas cadenas vienen en inglés), ajusta un par de textos y arranca el panel.
// Requiere window.CMS_MANUAL_INIT = true antes de cargar decap-cms.js.
(function () {
  var faltan = {
    collection: {
      sidebar: { collections: 'Panel de gestión', allCollections: 'Todas las secciones', searchIn: 'Buscar en' },
      collectionTop: {
        newButton: '＋ Nueva %{collectionLabel}',
        filterBy: 'Filtrar',
        groupBy: 'Agrupar',
        viewAsList: 'Ver como lista',
        viewAsGrid: 'Ver como tarjetas',
        searchResults: 'Resultados de «%{searchTerm}»',
        searchResultsInCollection: 'Resultados de «%{searchTerm}» en %{collection}'
      },
      entries: { unpublishedHeader: 'Sin publicar' },
      groups: { other: 'Otros', negateLabel: 'No %{label}' }
    },
    editor: {
      editorControlPane: { widget: { invalidPath: '«%{path}» no es una ruta válida', pathExists: 'La ruta «%{path}» ya existe' } },
      editorWidgets: {
        image: { chooseMultiple: 'Elegir fotos', chooseUrl: 'Insertar desde URL', replaceUrl: 'Reemplazar por URL', promptUrl: 'URL de la imagen', addMore: 'Añadir más fotos', removeAll: 'Quitar todas las fotos' },
        file: { chooseMultiple: 'Elegir archivos', chooseUrl: 'Insertar desde URL', replaceUrl: 'Reemplazar por URL', promptUrl: 'URL del archivo', addMore: 'Añadir más archivos', removeAll: 'Quitar todos los archivos' },
        list: { add: 'Añadir %{item}', addType: 'Añadir %{item}' },
        object: { expand: 'Desplegar', collapse: 'Plegar' }
      }
    },
    mediaLibrary: {
      mediaLibraryCard: { copy: 'Copiar', copyUrl: 'Copiar URL', copyPath: 'Copiar ruta', copyName: 'Copiar nombre', copied: 'Copiado' },
      mediaLibraryModal: { close: 'Cerrar' }
    },
    ui: {
      settingsDropdown: { account: 'Opciones de la cuenta' },
      toast: {
        onLoggedOut: 'Se ha cerrado la sesión. Guarda una copia de lo que estés editando y vuelve a entrar.',
        onBackendDown: 'El servicio no está disponible ahora mismo. Más información: %{details}'
      }
    }
  };
  function mezclar(base, extra) {
    for (var k in extra) {
      if (extra[k] && typeof extra[k] === 'object') base[k] = mezclar(base[k] || {}, extra[k]);
      else base[k] = extra[k];
    }
    return base;
  }
  CMS.registerLocale('es', mezclar(CMS.getLocale('es') || {}, faltan));
  CMS.init();
})();
