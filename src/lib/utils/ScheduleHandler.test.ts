import {ScheduleHandler} from "./ScheduleHandler";

describe("Schedule Handler", () => {
	it("should get current lessson", () => {
		// Expect(ScheduleHandler.getCurrentLesson([7, 50])).to.equal(0);
		// Expect(ScheduleHandler.getCurrentLesson([8, 35])).to.equal(1);
		// Expect(ScheduleHandler.getCurrentLesson([8, 48])).to.equal(1); // TODO: breaks tests on Travis but not on local
		expect(ScheduleHandler.getCurrentLesson([8, 58])).toEqual(2);
		expect(ScheduleHandler.getCurrentLesson([9, 11])).toEqual(2);
		expect(ScheduleHandler.getCurrentLesson([9, 44])).toEqual(2);
		expect(ScheduleHandler.getCurrentLesson([10, 1])).toEqual(3);
		expect(ScheduleHandler.getCurrentLesson([10, 46])).toEqual(3);
		expect(ScheduleHandler.getCurrentLesson([11, 36])).toEqual(4);
		expect(ScheduleHandler.getCurrentLesson([11, 46])).toEqual(4);
		expect(ScheduleHandler.getCurrentLesson([11, 56])).toEqual(5);
		expect(ScheduleHandler.getCurrentLesson([12, 11])).toEqual(5);
		expect(ScheduleHandler.getCurrentLesson([12, 46])).toEqual(6);
		expect(ScheduleHandler.getCurrentLesson([13, 28])).toEqual(6);
		expect(ScheduleHandler.getCurrentLesson([13, 59])).toEqual(6);
		expect(ScheduleHandler.getCurrentLesson([14, 1])).toEqual(7);
		expect(ScheduleHandler.getCurrentLesson([14, 57])).toEqual(8);
		expect(ScheduleHandler.getCurrentLesson([15, 39])).toEqual(8);
	});
});
