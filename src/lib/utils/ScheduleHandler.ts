import { closestIndexTo, compareDesc, isBefore, isPast, isToday, isWeekend, setHours, setMinutes, startOfToday } from "date-fns";

export namespace ScheduleHandler {
	/* Delcares when the particular lessons and breaks end */
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

		return lessonNumber - currentLesson < 5;
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
}
