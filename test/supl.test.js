let supl = require('../src/supl');
let expect = require('chai').expect;

describe('Supl library', () => {
	it('Should get class list', (done) => {
		supl.getClasses()
			.then((classes) => {
				expect(classes).to.be.an.instanceof(Array);
				expect(classes[0]).to.equal('I.A8');
				done();
			}).catch((err) => {
				done(err);
			});
	});

	it('Should get current dates list', (done) => {
		supl.getDates()
			.then((dates) => {
				expect(dates).to.be.an.instanceof(Array);
				expect(typeof dates[0].url).to.equal('string');
				expect(dates[0].date).to.exist;
				done();
			}).catch((err) => {
				done(err);
			});
	});

	it('Should get suplovani list', (done) => {
		let date_url;
		supl
			.getDates().then((res) => {
				date_url = res[0].url;
				supl.getSuplovani(date_url).then((suplovani) => {
					expect(suplovani).to.be.an.instanceof(Array);
					done();
				}).catch((err) => {
					done(err);
				});
			}, done);

	});
});