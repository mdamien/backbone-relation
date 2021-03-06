/* global Backbone */
/* global QUnit */
QUnit.module('Backbone.Relation it should ');
let model = null;
const MAuthor = Backbone.Model.extend();
const MEditor = Backbone.Model.extend();
const CWriter = Backbone.Collection.extend();
const MPost = Backbone.Model.extend({
    relations: {
        author: MAuthor,
        editor: MEditor,
        writers: CWriter,
    },
});

QUnit.test('add relations from a nested model', 2, (assert) => {
    const mPost = new MPost({
        author: { id: 5, name: 'Burhan Zainuddin' },
    });

    assert.ok(mPost.get('author') instanceof MAuthor);

    const MBlog = Backbone.Model.extend({
        relations: { post: MPost },
    });

    new MBlog({ post: mPost }); // eslint-disable-line no-new

    // After adding mPost to a mBlog, the original mPost should still have its relations.
    assert.ok(mPost.get('author') instanceof MAuthor);
});

QUnit.test('create a new model', 1, (assert) => {
    model = new Backbone.Model();

    assert.deepEqual(model.relations, {}, 'with empty relations.');
});

QUnit.test('allow setting a custom attributes format', 1, (assert) => {
    const Model = Backbone.Model.extend({
        formatAttributes(attrs) {
            attrs.test = true;
            return attrs;
        },
    });
    model = new Model();

    assert.ok(model.get('test'), true);
});

QUnit.test('create a new model with relations', 4, (assert) => {
    let hasAuthor = false;
    let hasEditor = false;
    let hasWriters = false;
    let MPostProxy = MPost.extend();
    let mPost = null;

    mPost = new MPostProxy(null);

    hasAuthor = mPost.get('author') instanceof MAuthor;
    hasEditor = mPost.get('editor') instanceof MEditor;
    hasWriters = mPost.get('writers') instanceof CWriter;
    assert.ok(hasAuthor && hasEditor && hasWriters, 'it should create relations those relations by default.');

    // Make sure that `options` takes precendence.
    mPost = new MPostProxy(null, { createRelations: false });
    hasAuthor = mPost.get('author') instanceof MAuthor;
    hasEditor = mPost.get('editor') instanceof MEditor;
    hasWriters = mPost.get('writers') instanceof CWriter;
    assert.ok(!hasAuthor && !hasEditor && !hasWriters, 'it should not create relations if createRelations is set to false in the options argument.');

    MPostProxy = MPostProxy.extend({ createRelations: false });
    mPost = new MPostProxy(null);
    hasAuthor = mPost.get('author') instanceof MAuthor;
    hasEditor = mPost.get('editor') instanceof MEditor;
    hasWriters = mPost.get('writers') instanceof CWriter;
    assert.ok(!hasAuthor && !hasEditor && !hasWriters, 'it should not create relations if createRelations is set to false when extending the model.');

    // Make sure that `options` takes precendence.
    mPost = new MPostProxy(null, { createRelations: true });
    hasAuthor = mPost.get('author') instanceof MAuthor;
    hasEditor = mPost.get('editor') instanceof MEditor;
    hasWriters = mPost.get('writers') instanceof CWriter;
    assert.ok(hasAuthor && hasEditor && hasWriters, 'it should create relations if createRelations is set to true in the options argument.');
});

QUnit.test('create new model without options', 1, (assert) => {
    const mPost = new MPost(null, {});
    assert.ok(mPost.get('author') instanceof MAuthor, 'will create that relation if not created before.');
});

QUnit.test('do nothing when setting a null key', 2, (assert) => {
    const mAuthor = new MAuthor({ id: 1 });

    mAuthor.set(null);
    assert.deepEqual(mAuthor.attributes, { id: 1 });
    mAuthor.set(null, 2);
    assert.deepEqual(mAuthor.attributes, { id: 1 });
});

QUnit.test('setting a related model', 4, (assert) => {
    const MPostProxy = MPost.extend({ createRelations: false });
    let mPost = new MPost();
    const authorAttributes = { id: 5, name: 'Burhan Zainuddin' };

    assert.equal(new MPost({ author: { id: 1 } }).get('author').get('id'), 1, 'using constructor.');

    mPost.set('author', { id: 1 });
    assert.equal(mPost.get('author').get('id'), 1, 'using key-value pairs.');

    mPost.set({ author: authorAttributes });

    assert.deepEqual(mPost.get('author').toJSON(), authorAttributes, 'using a hash.');

    mPost = new MPostProxy();
    mPost.set('author', null);
    assert.ok(mPost.get('author') instanceof MAuthor, 'will create that relation if not created before.');
});

QUnit.test('setting an existing model', 3, (assert) => {
    let mPost = new MPost();
    const mAuthorOriginal = mPost.get('author');
    const mAuthor = new MAuthor({ id: 6, name: 'AB Zainuddin' });

    // Set already existing model in mPost.
    mPost.set({ author: mAuthor });
    assert.ok(mPost.get('author') === mAuthorOriginal, 'use the existing model.');
    assert.deepEqual(mPost.get('author').toJSON(), { id: 6, name: 'AB Zainuddin' }, 'using a hash.');

    // Set not yet existing model.
    mPost = new MPost({ author: mAuthor });
    assert.deepEqual(mPost.get('author').toJSON(), { id: 6, name: 'AB Zainuddin' }, 'using a hash.');
});

QUnit.test('getting a related model using dot', 4, (assert) => {
    const mPost = new MPost({
        post: new MPost({
            id: 2,
            author: { id: 6, name: 'AB Zainuddin' },
        }),
        author: { id: 5, name: 'Burhan Zainuddin' },
    });

    assert.strictEqual(mPost.dot('author.id'), 5, 'on a related attribute.');
    assert.strictEqual(mPost.dot('post.author.id'), 6, 'on a related related attribute.');
    assert.strictEqual(mPost.dot('post.nope.id'), undefined, 'on a not existing relation.');
    assert.strictEqual(mPost.dot(null), undefined, 'using a null value.');
});

QUnit.test('setting a related model using an id', 2, (assert) => {
    const mPost = new MPost();

    mPost.set('author', 5);
    assert.equal(mPost.get('author').get('id'), 5, 'with a scalar will set the id.');

    mPost.set('author', null);
    assert.equal(mPost.get('author').get('id'), null, 'with a scalar will set the id.');
});

QUnit.test('instantiate a model with an existing model', 1, (assert) => {
    const mPost = new MPost({ id: 10 });
    const mPost2 = new MPost(mPost);

    assert.equal(mPost2.get('id'), 10);
});

QUnit.test('setting a related collection', 6, (assert) => {
    let mPost = new MPost();
    const cWriter = new CWriter([
        { id: 5, name: 'Burhan' },
        { id: 6, name: 'Zaico' },
    ]);
    const cWriterOthers = new CWriter([
        { id: 7, name: 'Kees' },
        { id: 8, name: 'SpaceK33z' },
    ]);
    const cWriterMoar = new CWriter([
        { id: 9, name: 'Jasper' },
        { id: 10, name: 'Japser' },
    ]);

    mPost.set('writers', cWriter);
    mPost.set('writers', cWriterOthers);
    assert.equal(mPost.get('writers').length, 2, 'with a collection will add / remove models.');
    assert.deepEqual(mPost.get('writers').pluck('id'), [7, 8], 'has correct ids.');
    mPost.set('writers', cWriterMoar, { remove: false });
    assert.equal(mPost.get('writers').length, 4, 'with remove:false will add models.');
    assert.deepEqual(mPost.get('writers').pluck('id'), [7, 8, 9, 10], 'has correct ids.');

    mPost.set('writers', [{ id: 1, name: 'Peter' }, { id: 2, name: 'Sjamaan' }]);
    assert.deepEqual(mPost.get('writers').pluck('id'), [1, 2], 'with an array will have correct ids.');

    mPost = new MPost({
        writers: cWriterOthers,
    });
    assert.deepEqual(mPost.get('writers').pluck('id'), [7, 8], 'blaatschaap.');
});

QUnit.test('setting a related collection using an array', 2, (assert) => {
    const mPost = new MPost();
    const postData = {
        writers: [
            { id: 5, name: 'Burhan' },
        ],
    };

    mPost.set(postData);
    assert.equal(mPost.get('writers').length, 1, 'with a collection will add / remove models.');
    assert.equal(postData.writers.length, 1, 'ensure that original array is intact.');
});

QUnit.test('dotting null value', 2, (assert) => {
    const mPost = new MPost({
        author: { id: 5, name: null },
    });

    assert.strictEqual(mPost.dot('author.name'), null, 'should return null.');
    assert.strictEqual(mPost.dot('author.name.shouldBeUndefined'), undefined, 'should return undefined.');
});

QUnit.test('passing current relation in options in setRelated', 2, (assert) => {
    const MPostOptions = MPost.extend({
        setByModelOrCollection(currentValue, newValue, options) {
            assert.equal(options.relation, 'author');
            return MPost.prototype.setByModelOrCollection.call(this, currentValue, newValue, options);
        },
    });
    let mPost = new MPostOptions();

    mPost.set({ author: { id: 5, name: 'Burhan' } });

    mPost = new MPostOptions({ author: { id: 5, name: 'Burhan' } });
});

QUnit.test('defining advanced relation', 1, (assert) => {
    const MPostAdvanced = MPost.extend({
        relations: {
            author: { relationClass: MAuthor },
        },
    });
    const mPost = new MPostAdvanced();

    mPost.set({ author: { id: 5, name: 'Burhan' } });
    assert.equal(mPost.dot('author.name'), 'Burhan');
});

QUnit.test('a change on a relation should trigger a change', 1, (assert) => {
    const mPost = new MPost();
    let cnt = 0;

    function spy(parent) {
        return function (...args) {
            if (args[0] === 'change') {
                cnt++;
            }

            return parent.apply(this, args);
        };
    }

    // Poor mans spy.
    mPost.trigger = spy(mPost.trigger);

    mPost.set({ author: { id: 5, name: 'Burhan' } }, { burhan: true });
    assert.equal(cnt, 1);
});
