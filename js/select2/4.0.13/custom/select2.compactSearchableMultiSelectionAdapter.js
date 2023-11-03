/*
 * Modified MultipleSelection selectionAdapter based on the original select2 version 4.0.13 at:
 * https://raw.githubusercontent.com/select2/select2/4.0.13/src/js/select2/selection/multiple.js
 * Tailored for the replacement of bootstrap-select
 */

$.fn.select2.amd.define('select2/selection/CountSelectionAdapter',
[
  'jquery',
  './base',
  './eventRelay',
  '../utils'
], function ($, BaseSelection, EventRelay, Utils) {
  function CountSelection ($element, options) {
    CountSelection.__super__.constructor.apply(this, arguments);
  }

  Utils.Extend(CountSelection, BaseSelection);
  
  CountSelection.prototype.render = function () {
    var $selection = CountSelection.__super__.render.call(this);

    //chris: usable with either the single or multiple selection css class while still behaving as the latter
    //$selection.addClass('select2-selection--single');
    $selection.addClass('select2-selection--multiple');
    $selection.attr('style', 'display: contents'); //don't show the border, just it's contents
    

    $selection.html(
        
      //original unordered list prototype
      //'<ul class="select2-selection__rendered"></ul>'
        
      //Szabi: less invasive solution?
      //'<ul class="select2-selection__rendered"></ul>'
      //  '<span class="select2-selection__rendered"></span>'
      //'<p class="select2-selection__rendered"></p>'
        
      //chris: nicely working solution
      //'<div class="d-grid"><button class="select2-selection__rendered btn btn-info justify-content-center" type="button"></button></div>'
      '<ul class="btn btn-light select2-selection__rendered justify-content-center" style="padding: 0px 1px 1px 0px; display: contents;"></ul>'
    );

    return $selection;
  };

  CountSelection.prototype.bind = function (container, $container) {
    var self = this;

    CountSelection.__super__.bind.apply(this, arguments);

    this.$selection.on('click', function (evt) {
      self.trigger('toggle', {
        originalEvent: evt
      });
    });

    this.$selection.on(
      'click',
      '.select2-selection__choice__remove',
      function (evt) {
        // Ignore the event if it is disabled
        if (self.isDisabled()) {
          return;
        }

        var $remove = $(this);
        var $selection = $remove.parent();


        var data = Utils.GetData($selection[0], 'data');

        self.trigger('unselect', {
          originalEvent: evt,
          data: data
        });
      }
    );
  };

  CountSelection.prototype.clear = function () {
    var $rendered = this.$selection.find('.select2-selection__rendered');
    $rendered.empty();

    $rendered.removeAttr('title');
  };

  CountSelection.prototype.display = function (data, container) {
    var template = this.options.get('templateSelection');
    var escapeMarkup = this.options.get('escapeMarkup');

    return escapeMarkup(template(data, container));
  };
  
  CountSelection.prototype.selectionContainer = function () {
    var $container = $(
      
      //original list element prototype
      /*'<li class="select2-selection__choice">' +
        '<span class="select2-selection__choice__remove" role="presentation">' +
          '&times;' +
        '</span>' +
      '</li>'*/

      //Szabi
      //'<span class="btn btn-light">' +
      //'</span>'
        
      //chris: nicely working solution
      //'<div><i class="bi bi-chevron-bar-expand"></i> </div>'
      
      //'<li class="btn btn-light">' + ' ' + this.options.get('c_dropdownIcon') + '</li>'
      '<li class="btn btn-light border border-1">' + '</li>'
      //'<li class="select2-selection__choice alert alert-primary">' + this.options.get('c_dropdownIcon') + ' ' + '</li>'

        
      );

    return $container;
  };

  CountSelection.prototype.update = function (data) {
    this.clear();

    //originally returns empty
    if (data.length === 0) {
        return;
    }

    var $selections = [];

    //originally renders an unordered list with data.length number of elements
    /*    for (var d = 0; d < data.length; d++) {
      var selection = data[d];

      var $selection = this.selectionContainer();
      var formatted = this.display(selection, $selection);

      $selection.append(formatted);

      var title = selection.title || selection.text;

      if (title) {
        $selection.attr('title', title);
      }

      Utils.StoreData($selection[0], 'data', selection);

      $selections.push($selection);
    }*/
    
    //Szabi: render only the first selection and put a custom element counting text into it
    //for (var d = 0; d < 1; d++) {
    var selection = data[0];

    var $selection = this.selectionContainer();
    var formatted = this.display(selection, $selection);

    //single selected element renders it's name, multiple counts them in a custom text
    if (data.length == 1) {

        $selection.append( this.options.get('c_singleSelIcon') + ' ' + formatted + ' ' + this.options.get('c_dropdownIcon'));
    }
    else {
        
        $selection.append(data.length + '/'+ this.$element[0].length);
        if (this.options.get('c_counterSuffix')) {
            $selection.append(' ' + this.options.get('c_counterSuffix') + ' ' + this.options.get('c_dropdownIcon'));
        }
        if (this.options.get('c_multiSelIcon')) {
            $selection.prepend(this.options.get('c_multiSelIcon') + ' ');
        }
    }

    //Szabi: empty non visible title
    var title = '';

    if (title) {
      $selection.attr('title', title);
    }

    Utils.StoreData($selection[0], 'data', selection);

    $selections.push($selection);

    var $rendered = this.$selection.find('.select2-selection__rendered');

    Utils.appendMany($rendered, $selections);
    
  };
  
  return CountSelection;
});

/* ---------------------------------------------------------------------------------*/

/*
 * Modified ResultsAdapter based on the original select2 version 4.0.13 at:
 * https://raw.githubusercontent.com/select2/select2/4.0.13/src/js/select2/results.js
 */

$.fn.select2.amd.define('select2/results/CheckIconResultsAdapter',
[
  'jquery',
  '../utils'
], function ($, Utils) {
  function Results ($element, options, dataAdapter) {
    this.$element = $element;
    this.data = dataAdapter;
    this.options = options;

    Results.__super__.constructor.call(this);
  }

  Utils.Extend(Results, Utils.Observable);

  Results.prototype.render = function () {
    var $results = $(
      '<ul class="select2-results__options" role="listbox"></ul>'
    );

    if (this.options.get('multiple')) {
      $results.attr('aria-multiselectable', 'true');
    }

    this.$results = $results;

    return $results;
  };

  Results.prototype.clear = function () {
    this.$results.empty();
  };

  Results.prototype.displayMessage = function (params) {
    var escapeMarkup = this.options.get('escapeMarkup');

    this.clear();
    this.hideLoading();

    var $message = $(
      '<li role="alert" aria-live="assertive"' +
      ' class="select2-results__option"></li>'
    );

    var message = this.options.get('translations').get(params.message);

    $message.append(
      escapeMarkup(
        message(params.args)
      )
    );

    $message[0].className += ' select2-results__message';

    this.$results.append($message);
  };

  Results.prototype.hideMessages = function () {
    this.$results.find('.select2-results__message').remove();
  };

  Results.prototype.append = function (data) {
    this.hideLoading();

    var $options = [];

    if (data.results == null || data.results.length === 0) {
      if (this.$results.children().length === 0) {
        this.trigger('results:message', {
          message: 'noResults'
        });
      }

      return;
    }

    data.results = this.sort(data.results);

    for (var d = 0; d < data.results.length; d++) {
      var item = data.results[d];

      var $option = this.option(item);

      $options.push($option);
    }

    this.$results.append($options);
  };

  Results.prototype.position = function ($results, $dropdown) {
    var $resultsContainer = $dropdown.find('.select2-results');
    $resultsContainer.append($results);
  };

  Results.prototype.sort = function (data) {
    var sorter = this.options.get('sorter');

    return sorter(data);
  };

  Results.prototype.highlightFirstItem = function () {
    var $options = this.$results
      .find('.select2-results__option[aria-selected]');

    var $selected = $options.filter('[aria-selected=true]');

    // Check if there are any selected options
    if ($selected.length > 0) {
      // If there are selected options, highlight the first
      $selected.first().trigger('mouseenter');
    } else {
      // If there are no selected options, highlight the first option
      // in the dropdown
      $options.first().trigger('mouseenter');
    }

    this.ensureHighlightVisible();
  };

  Results.prototype.setClasses = function () {
    var self = this;

    this.data.current(function (selected) {
      var selectedIds = $.map(selected, function (s) {
        return s.id.toString();
      });

      var $options = self.$results
        .find('.select2-results__option[aria-selected]');

      $options.each(function () {
        var $option = $(this);

        var item = Utils.GetData(this, 'data');

        // id needs to be converted to a string when comparing
        var id = '' + item.id;

        //originally uses plaintext
        /*if ((item.element != null && item.element.selected) ||
            (item.element == null && $.inArray(id, selectedIds) > -1)) {
          $option.attr('aria-selected', 'true');
        } else {
          $option.attr('aria-selected', 'false');
        }*/
          
        //chris: prepends or removes checkmark icon in front of list element text
        if ((item.element != null && item.element.selected) ||
            (item.element == null && $.inArray(id, selectedIds) > -1)) {
          $option.attr('aria-selected', 'true');
          $option.children().remove();
          //$option.prepend('<i class="result-check-icon bi bi-check-circle-fill" style="float: right;"></i>');
          $option.append(self.options.get('c_selectedIcon'));
        } else {
          $option.attr('aria-selected', 'false');
          $option.children().remove();
        }
      });

    });
  };

  Results.prototype.showLoading = function (params) {
    this.hideLoading();

    var loadingMore = this.options.get('translations').get('searching');

    var loading = {
      disabled: true,
      loading: true,
      text: loadingMore(params)
    };
    var $loading = this.option(loading);
    $loading.className += ' loading-results';

    this.$results.prepend($loading);
  };

  Results.prototype.hideLoading = function () {
    this.$results.find('.loading-results').remove();
  };

  Results.prototype.option = function (data) {
    var option = document.createElement('li');
    option.className = 'select2-results__option';

    var attrs = {
      'role': 'option',
      'aria-selected': 'false'
    };

    var matches = window.Element.prototype.matches ||
      window.Element.prototype.msMatchesSelector ||
      window.Element.prototype.webkitMatchesSelector;

    if ((data.element != null && matches.call(data.element, ':disabled')) ||
        (data.element == null && data.disabled)) {
      delete attrs['aria-selected'];
      attrs['aria-disabled'] = 'true';
    }

    if (data.id == null) {
      delete attrs['aria-selected'];
    }

    if (data._resultId != null) {
      option.id = data._resultId;
    }

    if (data.title) {
      option.title = data.title;
    }

    if (data.children) {
      attrs.role = 'group';
      attrs['aria-label'] = data.text;
      delete attrs['aria-selected'];
    }

    for (var attr in attrs) {
      var val = attrs[attr];

      option.setAttribute(attr, val);
    }

    if (data.children) {
      var $option = $(option);

      var label = document.createElement('strong');
      label.className = 'select2-results__group';

      var $label = $(label);
      this.template(data, label);

      var $children = [];

      for (var c = 0; c < data.children.length; c++) {
        var child = data.children[c];

        var $child = this.option(child);

        $children.push($child);
      }

      var $childrenContainer = $('<ul></ul>', {
        'class': 'select2-results__options select2-results__options--nested'
      });

      $childrenContainer.append($children);

      $option.append(label);
      $option.append($childrenContainer);
    } else {
      this.template(data, option);
    }

    Utils.StoreData(option, 'data', data);

    return option;
  };

  Results.prototype.bind = function (container, $container) {
    var self = this;

    var id = container.id + '-results';

    this.$results.attr('id', id);

    container.on('results:all', function (params) {
      self.clear();
      self.append(params.data);

      if (container.isOpen()) {
        self.setClasses();
        self.highlightFirstItem();
      }
    });

    container.on('results:append', function (params) {
      self.append(params.data);

      if (container.isOpen()) {
        self.setClasses();
      }
    });

    container.on('query', function (params) {
      self.hideMessages();
      self.showLoading(params);
    });

    container.on('select', function () {
      if (!container.isOpen()) {
        return;
      }

      self.setClasses();

      if (self.options.get('scrollAfterSelect')) {
        self.highlightFirstItem();
      }
    });

    container.on('unselect', function () {
      if (!container.isOpen()) {
        return;
      }

      self.setClasses();

      if (self.options.get('scrollAfterSelect')) {
        self.highlightFirstItem();
      }
    });

    container.on('open', function () {
      // When the dropdown is open, aria-expended="true"
      self.$results.attr('aria-expanded', 'true');
      self.$results.attr('aria-hidden', 'false');

      self.setClasses();
      self.ensureHighlightVisible();
    });

    container.on('close', function () {
      // When the dropdown is closed, aria-expended="false"
      self.$results.attr('aria-expanded', 'false');
      self.$results.attr('aria-hidden', 'true');
      self.$results.removeAttr('aria-activedescendant');
    });

    container.on('results:toggle', function () {
      var $highlighted = self.getHighlightedResults();

      if ($highlighted.length === 0) {
        return;
      }

      $highlighted.trigger('mouseup');
    });

    container.on('results:select', function () {
      var $highlighted = self.getHighlightedResults();

      if ($highlighted.length === 0) {
        return;
      }

      var data = Utils.GetData($highlighted[0], 'data');

      if ($highlighted.attr('aria-selected') == 'true') {
        self.trigger('close', {});
      } else {
        self.trigger('select', {
          data: data
        });
      }
    });

    container.on('results:previous', function () {
      var $highlighted = self.getHighlightedResults();

      var $options = self.$results.find('[aria-selected]');

      var currentIndex = $options.index($highlighted);

      // If we are already at the top, don't move further
      // If no options, currentIndex will be -1
      if (currentIndex <= 0) {
        return;
      }

      var nextIndex = currentIndex - 1;

      // If none are highlighted, highlight the first
      if ($highlighted.length === 0) {
        nextIndex = 0;
      }

      var $next = $options.eq(nextIndex);

      $next.trigger('mouseenter');

      var currentOffset = self.$results.offset().top;
      var nextTop = $next.offset().top;
      var nextOffset = self.$results.scrollTop() + (nextTop - currentOffset);

      if (nextIndex === 0) {
        self.$results.scrollTop(0);
      } else if (nextTop - currentOffset < 0) {
        self.$results.scrollTop(nextOffset);
      }
    });

    container.on('results:next', function () {
      var $highlighted = self.getHighlightedResults();

      var $options = self.$results.find('[aria-selected]');

      var currentIndex = $options.index($highlighted);

      var nextIndex = currentIndex + 1;

      // If we are at the last option, stay there
      if (nextIndex >= $options.length) {
        return;
      }

      var $next = $options.eq(nextIndex);

      $next.trigger('mouseenter');

      var currentOffset = self.$results.offset().top +
        self.$results.outerHeight(false);
      var nextBottom = $next.offset().top + $next.outerHeight(false);
      var nextOffset = self.$results.scrollTop() + nextBottom - currentOffset;

      if (nextIndex === 0) {
        self.$results.scrollTop(0);
      } else if (nextBottom > currentOffset) {
        self.$results.scrollTop(nextOffset);
      }
    });

    container.on('results:focus', function (params) {
      params.element.addClass('select2-results__option--highlighted');
    });

    container.on('results:message', function (params) {
      self.displayMessage(params);
    });

    if ($.fn.mousewheel) {
      this.$results.on('mousewheel', function (e) {
        var top = self.$results.scrollTop();

        var bottom = self.$results.get(0).scrollHeight - top + e.deltaY;

        var isAtTop = e.deltaY > 0 && top - e.deltaY <= 0;
        var isAtBottom = e.deltaY < 0 && bottom <= self.$results.height();

        if (isAtTop) {
          self.$results.scrollTop(0);

          e.preventDefault();
          e.stopPropagation();
        } else if (isAtBottom) {
          self.$results.scrollTop(
            self.$results.get(0).scrollHeight - self.$results.height()
          );

          e.preventDefault();
          e.stopPropagation();
        }
      });
    }

    this.$results.on('mouseup', '.select2-results__option[aria-selected]',
      function (evt) {
      var $this = $(this);

      var data = Utils.GetData(this, 'data');

      if ($this.attr('aria-selected') === 'true') {
        if (self.options.get('multiple')) {
          self.trigger('unselect', {
            originalEvent: evt,
            data: data
          });
        } else {
          self.trigger('close', {});
        }

        return;
      }

      self.trigger('select', {
        originalEvent: evt,
        data: data
      });
    });

    this.$results.on('mouseenter', '.select2-results__option[aria-selected]',
      function (evt) {
      var data = Utils.GetData(this, 'data');

      self.getHighlightedResults()
          .removeClass('select2-results__option--highlighted');

      self.trigger('results:focus', {
        data: data,
        element: $(this)
      });
    });
  };

  Results.prototype.getHighlightedResults = function () {
    var $highlighted = this.$results
    .find('.select2-results__option--highlighted');

    return $highlighted;
  };

  Results.prototype.destroy = function () {
    this.$results.remove();
  };

  Results.prototype.ensureHighlightVisible = function () {
    var $highlighted = this.getHighlightedResults();

    if ($highlighted.length === 0) {
      return;
    }

    var $options = this.$results.find('[aria-selected]');

    var currentIndex = $options.index($highlighted);

    var currentOffset = this.$results.offset().top;
    var nextTop = $highlighted.offset().top;
    var nextOffset = this.$results.scrollTop() + (nextTop - currentOffset);

    var offsetDelta = nextTop - currentOffset;
    nextOffset -= $highlighted.outerHeight(false) * 2;

    if (currentIndex <= 2) {
      this.$results.scrollTop(0);
    } else if (offsetDelta > this.$results.outerHeight() || offsetDelta < 0) {
      this.$results.scrollTop(nextOffset);
    }
  };

  Results.prototype.template = function (result, container) {
    var template = this.options.get('templateResult');
    var escapeMarkup = this.options.get('escapeMarkup');

    var content = template(result, container);

    if (content == null) {
      container.style.display = 'none';
    } else if (typeof content === 'string') {
      container.innerHTML = escapeMarkup(content);
    } else {
      $(container).append(content);
    }
  };

  return Results;
});

/* ---------------------------------------------------------------------------------*/

/*
 * combobox and dropdown search functionality is missing, because Defaults.prototype.apply 
 * only uses it with built-in single/multiple Adapters near lines:
 *     if (options.multiple) {
 *       options.selectionAdapter = Utils.Decorate(
 *         options.selectionAdapter,
 *         SelectionSearch
 *       );
 *     }
 * Issue: https://github.com/select2/select2/issues/5246#issuecomment-377809398
 */

// Extend/decorate 'select2/defaults' selectionAdapter /w 
// built-in SelectionSearch input (in the combobox) or DropdownSearch (in the dropdown)
// Source: https://github.com/andreivictor/select2-customSelectionAdapter/blob/master/dist/js/select2.customSelectionAdapter.js

(function() {

  var Defaults = $.fn.select2.amd.require('select2/defaults');
  var Placeholder = $.fn.select2.amd.require('select2/selection/placeholder');
  var AllowClear = $.fn.select2.amd.require('select2/selection/allowClear');
  var SelectionSearch = $.fn.select2.amd.require('select2/selection/search');
  var Dropdown = $.fn.select2.amd.require('select2/dropdown');
  var DropdownSearch = $.fn.select2.amd.require('select2/dropdown/search');
  var AttachBody = $.fn.select2.amd.require('select2/dropdown/attachBody');
  
  var Utils = $.fn.select2.amd.require('select2/utils');

  //parent method - apply
  var _defaultApply = Defaults.apply;

  Defaults.apply = function (options) {

    //add placeholder when it's defined
    if (options.selectionAdapter) {
      if (options.placeholder != null) {
        options.selectionAdapter = Utils.Decorate(
          options.selectionAdapter,
          Placeholder
        );
      }

      //add search control when enabled
      if (options.c_allowSearch) { 
        //add search to combobox
        if (options.c_searchPlacement && options.c_searchPlacement == 'combobox') {
            options.selectionAdapter = Utils.Decorate(
                options.selectionAdapter,
                SelectionSearch
            );
        }
        //add search to dropdown
        else {
            options.dropdownAdapter = Utils.Decorate(
                Utils.Decorate(
                    Dropdown,
                    DropdownSearch
                ),
                AttachBody
            );
        }
      }
      //add all-clear control to selection when enabled
      if (options.allowClear) {
        options.selectionAdapter = Utils.Decorate(
          options.selectionAdapter,
          AllowClear
        );
      }
    }

    //invoke parent method
    return _defaultApply.apply(this, arguments);
  }

})();

/* ---------------------------------------------------------------------------------*/

/* these variables expose the two loadable select2 modules */

//include this custom selection box appearance using select2's option 'selectionAdapter' at initialization
var CountSelectionAdapter = $.fn.select2.amd.require("select2/selection/CountSelectionAdapter");

//include this custom option list appearance using select2's option 'resultsAdapter' at initialization
var CheckIconResultsAdapter = $.fn.select2.amd.require("select2/results/CheckIconResultsAdapter");
