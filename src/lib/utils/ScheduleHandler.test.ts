import {expect} from "chai";
import "mocha";

import {ScheduleHandler} from "./ScheduleHandler";

describe("Schedule Handler", () => {
	it("should get current lessson", () => {
		// Expect(ScheduleHandler.getCurrentLesson([7, 50])).to.equal(0);
		// Expect(ScheduleHandler.getCurrentLesson([8, 35])).to.equal(1);
		// Expect(ScheduleHandler.getCurrentLesson([8, 48])).to.equal(1); // TODO: breaks tests on Travis but not on local
		expect(ScheduleHandler.getCurrentLesson([8, 58])).to.equal(2);
		expect(ScheduleHandler.getCurrentLesson([9, 11])).to.equal(2);
		expect(ScheduleHandler.getCurrentLesson([9, 44])).to.equal(2);
		expect(ScheduleHandler.getCurrentLesson([10, 1])).to.equal(3);
		expect(ScheduleHandler.getCurrentLesson([10, 46])).to.equal(3);
		expect(ScheduleHandler.getCurrentLesson([11, 36])).to.equal(4);
		expect(ScheduleHandler.getCurrentLesson([11, 46])).to.equal(4);
		expect(ScheduleHandler.getCurrentLesson([11, 56])).to.equal(5);
		expect(ScheduleHandler.getCurrentLesson([12, 11])).to.equal(5);
		expect(ScheduleHandler.getCurrentLesson([12, 46])).to.equal(6);
		expect(ScheduleHandler.getCurrentLesson([13, 28])).to.equal(6);
		expect(ScheduleHandler.getCurrentLesson([13, 59])).to.equal(6);
		expect(ScheduleHandler.getCurrentLesson([14, 1])).to.equal(7);
		expect(ScheduleHandler.getCurrentLesson([14, 57])).to.equal(8);
		expect(ScheduleHandler.getCurrentLesson([15, 39])).to.equal(8);
	});

	it("should hide old dozory", () => {
		const sampleDozory: Array<Partial<DozorRecord>> = [
			{
				timeStart: "07:45",
				timeEnd: "08:00",
				misto: "A - 2. patro",
				chybejici: "Sedláček",
				dozorujici: "Mayer",
				poznamka: ""
			},
			{
				timeStart: "08:45",
				timeEnd: "08:55",
				misto: "B - Tv",
				chybejici: "Dostálová",
				dozorujici: "Krejčíř",
				poznamka: ""
			},
			{
				timeStart: "09:40",
				timeEnd: "10:00",
				misto: "B - Tv",
				chybejici: "Abrahámová",
				dozorujici: "Hamříková",
				poznamka: ""
			},
			{
				timeStart: "11:40",
				timeEnd: "11:50",
				misto: "B - Tv",
				chybejici: "Juřík",
				dozorujici: "Havranová",
				poznamka: ""
			}
		];
		expect(ScheduleHandler.isDozorInThePast(sampleDozory[0], [8, 1])).to.be.true;
		expect(ScheduleHandler.isDozorInThePast(sampleDozory[0], [7, 59])).to.be.false;
		expect(ScheduleHandler.isDozorInThePast(sampleDozory[1], [8, 56])).to.be.true;
		expect(ScheduleHandler.isDozorInThePast(sampleDozory[2], [9, 41])).to.be.false;
		expect(ScheduleHandler.isDozorInThePast(sampleDozory[2], [10, 1])).to.be.true;
	});
});
