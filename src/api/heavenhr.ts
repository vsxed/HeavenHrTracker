import { SimpleTimeTrackerSettings } from "src/settings";
import { enc } from 'crypto-js';
import { TimeTrackingCreateRequest } from "src/tracker";


interface IHeavenHrApi {
	refreshToken(): Promise<string>;
	getEmployees(): Promise<any>;
	trackTime(ttr: TimeTrackingCreateRequest): Promise<any>;
	getProjects(userId: string): Promise<any>;
	getCategories(): Promise<any>;
}

class HeavenHrApi implements IHeavenHrApi {
	private settings: SimpleTimeTrackerSettings;
	private callback: Promise<void>;

	constructor(settings: SimpleTimeTrackerSettings, cb: Promise<void>) {
		this.settings = settings;
		this.callback = cb;
	}

	public refreshToken(): Promise<string> {
		return new Promise(async (resolve, reject) => {
            if (this.settings.client_id.length == 0)
                return reject(new Error("No client_id set"));
    
            if (this.settings.client_secret.length == 0)
                return reject(new Error("No client_secret set"));
    
            // prepare
            const encryptedAccessString = enc.Utf8.parse(this.settings.client_id + ":" + this.settings.client_secret);
            const heavenHrApiKey = enc.Base64.stringify(encryptedAccessString);

			const data = await fetch("https://heavenhr-api-wrapper.vercel.app/api/auth/refresh-token", {
				method: "GET",
				headers: { Authorization: `Basic ${heavenHrApiKey}` }
			})
				.then(response => response.json())
				.then(data => {
					return data;
				}).catch(err => {
					return reject(null);
				});

			// save access token
			if (data.access_token) {

				this.settings.heavenHrAccessToken = data.access_token;
				this.callback;

				return resolve(data.access_token);
			} else {
				return reject(null);
			}
		});
	}

	public getEmployees(): Promise<any> {

		return new Promise(async (resolve, reject) => {
			const data = await fetch("https://heavenhr-api-wrapper.vercel.app/api/employee/list", {
				method: "GET",
				headers: { Authorization: `Bearer ${this.settings.heavenHrAccessToken}` }
			})
				.then(response => response.json())
				.then(data => {
					return resolve(data);
				}).catch(err => {
					return reject(null);
				});
		});
	}

	public trackTime(ttr: TimeTrackingCreateRequest): Promise<any> {
		return new Promise(async (resolve, reject) => {
			const data = await fetch(`https://heavenhr-api-wrapper.vercel.app/api/employee/${this.settings.heavenHrUserId}/track`, {
				method: "POST",
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.settings.heavenHrAccessToken}`
				},
				body: JSON.stringify(ttr)
			})
				.then(response => response.json())
				.then(data => {
					return resolve(data);
				}).catch(err => {
					return reject(null);
				});
		});
	}

	public getProjects(userId: string): Promise<any> {
		return new Promise(async (resolve, reject) => {
			const data = await fetch(`https://heavenhr-api-wrapper.vercel.app/api/employee/${userId}/projects`, {
				method: "GET",
				headers: { Authorization: `Bearer ${this.settings.heavenHrAccessToken}` }
			})
				.then(response => response.json())
				.then(data => {
					return resolve(data);
				}).catch(err => {
					return reject(null);
				});
		});
	}

	public getCategories(): Promise<any> {
		return new Promise(async (resolve, reject) => {
			const data = await fetch(`https://heavenhr-api-wrapper.vercel.app/api/company/categories`, {
				method: "GET",
				headers: { Authorization: `Bearer ${this.settings.heavenHrAccessToken}` }
			})
				.then(response => response.json())
				.then(data => {
					return resolve(data);
				}).catch(err => {
					return reject(null);
				});
		});
	}

}

// export the class
export default HeavenHrApi;
