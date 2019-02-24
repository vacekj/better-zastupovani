import { expect } from "chai";
import "mocha";

import { ScheduleHandler } from "./ScheduleHandler";

describe("Schedule Handler", () => {
	it("should get current lessson", () => {
		expect(ScheduleHandler.getCurrentLesson([7, 50])).to.equal(0);
		expect(ScheduleHandler.getCurrentLesson([8, 35])).to.equal(1);
		expect(ScheduleHandler.getCurrentLesson([8, 48])).to.equal(1);
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
});
