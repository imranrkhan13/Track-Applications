import test from 'node:test';
import assert from 'node:assert/strict';
import { classifySource, companyProfile, hostOf } from '../src/career/companyProfile.js';

test('hostOf: strips www and handles bad URLs', () => {
    assert.equal(hostOf('https://www.stripe.com/jobs'), 'stripe.com');
    assert.equal(hostOf('not a url'), '');
});

test('classifySource: review hosts win', () => {
    assert.equal(classifySource({ url: 'https://www.glassdoor.com/Interview/x.htm' }), 'reviews');
    assert.equal(classifySource({ url: 'https://www.ambitionbox.com/companies/x/reviews' }), 'reviews');
});

test('classifySource: job boards are hiring', () => {
    assert.equal(classifySource({ url: 'https://boards.greenhouse.io/stripe' }), 'hiring');
    assert.equal(classifySource({ url: 'https://jobs.lever.co/acme' }), 'hiring');
});

test('classifySource: careers path and text are hiring', () => {
    assert.equal(classifySource({ url: 'https://acme.com/careers' }), 'hiring');
    assert.equal(classifySource({ url: 'https://acme.com/x', title: 'Open roles at Acme' }), 'hiring');
});

test('classifySource: engineering/blog paths are tech', () => {
    assert.equal(classifySource({ url: 'https://acme.com/engineering/blog' }), 'tech');
    assert.equal(classifySource({ url: 'https://acme.com/x', title: 'Our tech stack' }), 'tech');
});

test('classifySource: default is product', () => {
    assert.equal(classifySource({ url: 'https://acme.com/about' }), 'product');
});

test('companyProfile: groups sources, counts hosts, ignores url-less entries', () => {
    const research = {
        sources: [
            { title: 'Acme home', url: 'https://acme.com/' },
            { title: 'Acme careers', url: 'https://acme.com/careers' },
            { title: 'Acme eng blog', url: 'https://acme.com/engineering' },
            { title: 'Glassdoor', url: 'https://www.glassdoor.com/Interview/acme.htm' },
            { title: 'no url' },
        ],
    };
    const profile = companyProfile(research);
    assert.equal(profile.total, 4);
    assert.equal(profile.buckets.product.length, 1);
    assert.equal(profile.buckets.hiring.length, 1);
    assert.equal(profile.buckets.tech.length, 1);
    assert.equal(profile.buckets.reviews.length, 1);
    assert.deepEqual(profile.hosts[0], { host: 'acme.com', count: 3 });
});

test('companyProfile: empty research yields zero totals', () => {
    const profile = companyProfile(undefined);
    assert.equal(profile.total, 0);
    assert.equal(profile.hosts.length, 0);
});
