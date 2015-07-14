import Ember from 'ember';
import Resource from 'ember-api-store/models/resource';

var Mount = Resource.extend({
  isReadWrite: Ember.computed.equal('permissions','rw'),
  isReadOnly:  Ember.computed.equal('permissions','ro'),

  instance: function() {
    var proxy = Ember.ObjectProxy.create({content: {}});
    this.get('store').find('container', this.get('instanceId')).then((container) => {
      proxy.set('content', container);
    });

    return proxy;
  }.property('instanceId'),
});

export default Mount;
