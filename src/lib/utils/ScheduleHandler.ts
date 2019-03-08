import { compareDesc, isBefore, isPast, setHours, setMinutes, startOfToday } from "date-fns";
import { DozorRecord, NahradniUcebnaRecord, SuplovaniRecord, SuplovaniPage } from "../parsing/suplParser";

export namespace ScheduleHandler {
	/* Declares when the particular lessons and breaks end */
	const lessonMappings: ILesson[] = [
		{ hour: 8, minute: 55 },
		{ hour: 10, minute: 0 },
		{ hour: 10, minute: 55 },
		{ hour: 11, minute: 50 },
		{ hour: 12, minute: 45 },
		{ hour: 14, minute: 0 },
		{ hour: 14, minute: 55 },
		{ hour: 15, minute: 40 }
	];

	export function isLessonInPast(lessonNumber: number, mockTime?: [number, number]) {
		const correspondingLesson = lessonMappings[lessonNumber - 1];
		const lessonDate = setMinutes(setHours(startOfToday(), correspondingLesson.hour), correspondingLesson.minute);
		if (mockTime) {
			const mockDate = setMinutes(setHours(startOfToday(), mockTime[0]), mockTime[1]);
			return compareDesc(lessonDate, mockDate) === 1;
		} else {
			return isPast(lessonDate);
		}
	}

	export function isLessonTooFarAwayInTheFuture(lessonNumber) {
		const currentLesson = getCurrentLesson();

		/* How many lessons to show in advance */
		const LESSON_RANGE = 3;

		return lessonNumber - currentLesson > LESSON_RANGE;
	}

	export function getCurrentLesson(mockTime?: [number, number]) {
		const startOfClasses = setMinutes(setHours(startOfToday(), 8), 0);
		if (isBefore(new Date(), startOfClasses)) {
			return 0;
		}
		if (mockTime) {
			const mockDate = setMinutes(setHours(startOfToday(), mockTime[0]), mockTime[1]);
			if (isBefore(mockDate, startOfClasses)) {
				return 0;
			}
		}
		const lessonNumbers = [1, 2, 3, 4, 5, 6, 7, 8];
		const currentlesson = lessonNumbers.find((lessonNumber) => {
			return !isLessonInPast(lessonNumber, mockTime);
		});
		return currentlesson;
	}

	interface ILesson {
		hour: number;
		minute: number;
	}

	export function isDozorInThePast(dozor: Partial<DozorRecord>, mockTime?: [number, number]) {
		const dozorHour = parseInt(dozor.timeEnd.slice(0, 2), 10);
		const dozorMinute = parseInt(dozor.timeEnd.slice(3, 5), 10);
		const dozorDate = setMinutes(setHours(startOfToday(), dozorHour), dozorMinute);
		if (mockTime) {
			const mockDate = setMinutes(setHours(startOfToday(), mockTime[0]), mockTime[1]);
			return compareDesc(dozorDate, mockDate) === 1;
		} else {
			return isPast(dozorDate);
		}
	}
}

/* TODO: test this */
export namespace ScheduleFilter {
	export function filterNahradniUcebny(nahradniUcebnyRecords: NahradniUcebnaRecord[]): NahradniUcebnaRecord[] {
		return nahradniUcebnyRecords.filter((record) => {
			return !ScheduleHandler.isLessonInPast(parseInt(record.hodina, 10));
		});
	}

	function shouldRecordBeShown(record: SuplovaniRecord) {
		return !ScheduleHandler.isLessonInPast(parseInt(record.hodina, 10));
	}

	export function filterSuplovaniPage(suplPage: SuplovaniPage): SuplovaniPage {
		const filtered = suplPage;
		filtered.suplovani = suplPage.suplovani.filter(shouldRecordBeShown);
		return filtered;
	}

	export function filterDozory(dozory: DozorRecord[]): DozorRecord[] {
		return dozory.filter((dozor) => {
			return !ScheduleHandler.isDozorInThePast(dozor);
		});
	}
}
