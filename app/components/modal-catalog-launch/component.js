import Ember from 'ember';
import NewOrEdit from 'ui/mixins/new-or-edit';

export default Ember.Component.extend(NewOrEdit, {
  primaryResource: Ember.computed.alias('environmentResource'),
  highlightAll: function() {
    this.$('CODE').each(function(idx, elem) {
      Prism.highlightElement(elem);
    });
  },
  actions: {
    cancel: function() {
      this.sendAction('dismiss');
    },
    togglePreview: function() {
      if (this.get('previewOpen')) {
        this.highlightAll();
      }
      this.toggleProperty('previewOpen');
    }
  },
  environmentResource: null,
  versionsArray: null,
  selectedTemplate: null,
  selectedTemplateModel: null,
  success: false,
  loading: false,
  templateName: null,
  templateDescription: null,
  previewOpen: false,
  versions: Ember.on('init', function() {
    var verArr = [];
    _.forEach(this.get('originalModel.versionLinks'), (value, key) => {
      verArr.push({
        version: key,
        link: value
      });
    });
    this.set('versionsArray', verArr);
  }),
  templateChanged: function() {
    this.set('loading', true);
    Ember.$.ajax(this.get('selectedTemplate'), 'GET').then((response) => {
      if (response.questions) {
        response.questions.forEach((item) => {
          item.answer = item.default;
        });
      }
      this.set('selectedTemplateModel', response);
      this.set('loading', false);
      Ember.run.later(() => {
        this.highlightAll();
      });
    }, ( /*error*/ ) => {});
  }.observes('selectedTemplate'),
  willSave: function() {
    this.set('errors', null);
    var ok = this.validate();
    if (!ok) {
      // Validation failed
      return false;
    }

    if (this.get('saving')) {
      // Already saving
      return false;
    }

    var environments = {};
    this.get('selectedTemplateModel.questions').forEach((item) => {
      environments[item.variable] = item.answer;
    });
    this.set('saving', true);
    this.set('environmentResource', this.get('store').createRecord({
      type: 'environment',
      name: this.get('templateName'),
      description: this.get('templateDescription'),
      dockerCompose: this.get('selectedTemplateModel.dockerCompose'),
      rancherCompose: this.get('selectedTemplateModel.rancherCompose'),
      environment: environments,
      uuid: this.get('selectedTemplateModel.uuid')
    }));

    return true;
  },
  validate: function() {
    var errors = [];
    if (!this.get('templateName')) {
      errors.push('Name is required');
    }
    if (!this.get('templateDescription')) {
      errors.push('Description is required');
    }

    if (this.get('selectedTemplateModel.questions')) {
      this.get('selectedTemplateModel.questions').forEach((item) => {
        if (item.required && !item.answer){
          errors.push(`${item.label} is required`);
        }
      });
    }

    if (errors.length) {
      this.set('errors', errors.uniq());
      return false;
    }

    return true;
  },
  doneSaving: function() {
    this.sendAction('dismiss');
    return this.get('router').transitionTo('environment', this.get('primaryResource.id'));
  }

});
