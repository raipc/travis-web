import Component from '@ember/component';
import { service } from 'ember-decorators/service';
import { task, timeout } from 'ember-concurrency';

export default Component.extend({
  @service store: null,

  classNames: ['form--cron'],

  reset() {
    this.setProperties({
      selectedBranch: null,
      selectedInterval: null,
      disable: null
    });
  },

  save: task(function* () {
    const store = this.get('store');
    const repoId = this.get('branches.firstObject.repoId');
    const branch = this.get('selectedBranch') || this.get('branches.firstObject');

    const existingCrons = yield store.filter('cron', { repository_id: repoId }, (c) => {
      c.get('branch.repoId') === repoId && c.get('branch.name') === branch.get('name');
    });

    if (existingCrons.get('firstObject')) {
      store.unloadRecord(existingCrons.get('firstObject'));
    }

    const cron = store.createRecord('cron', {
      branch,
      interval: this.get('selectedInterval') || 'monthly',
      dont_run_if_recent_build_exists: this.get('selectedOption') || false
    });

    this.reset();

    yield cron.save();
  }).drop(),

  searchBranches: task(function* (term) {
    // FIXME why? When I originally had the yield instead of the return, nothing showed in the results.
    yield timeout(1);
    const store = this.get('store');
    const repoId = this.get('branches.firstObject.repoId');

    return store.query('branch', { repository_id: repoId, name_filter: term });
  }),

  intervals: ['monthly', 'weekly', 'daily'],

  options: ['Always run', 'Do not run if there has been a build in the last 24h']
});
