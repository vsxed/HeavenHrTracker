export const defaultSettings: SimpleTimeTrackerSettings = {
    timestampFormat: "YY-MM-DD HH:mm:ss",
    editableTimestampFormat: "YYYY-MM-DD HH:mm:ss",
    csvDelimiter: ",",
    fineGrainedDurations: true,
    reverseSegmentOrder: false,
    timestampDurations: false,
	enablePunchInOut: true,
	client_id: "",
	client_secret: "",
	heavenHrAccessToken: "",
	heavenHrUserId: "",
	heavenHrProjectId: "",
	heavenHrCategoryId: "",
	pauseKeywords: ["pause", "break", "lunch", "dinner", "toilet"],
	heavenHrTrackingStatus: "REQUESTED"
};

export interface SimpleTimeTrackerSettings {
    timestampFormat: string;
    editableTimestampFormat: string;
    csvDelimiter: string;
    fineGrainedDurations: boolean;
    reverseSegmentOrder: boolean;
    timestampDurations: boolean;
	enablePunchInOut: boolean;
	client_id: string;
	client_secret: string;
	heavenHrAccessToken: string;
	heavenHrUserId: string;
	heavenHrProjectId: string;
	heavenHrCategoryId: string;
	pauseKeywords: string[];
	heavenHrTrackingStatus: string;
}
