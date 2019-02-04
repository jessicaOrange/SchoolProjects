import { environment } from '../../environments/environment';
import {HttpHeaders} from '@angular/common/http';

export enum LOG { VERBOSE=0, DEBUG=1, INFO=2, WARNING=3, ERROR=4, LOG=5 }

export class TravlendarUtils {
	static logStringify = false;
	static logDisplayFilename = true;

	static debugConsole (content) {
		TravlendarUtils.log(content, "(DEPRECATED LOG CALL)");
	}

	static log(content, file?, level?:LOG) {
		if(!environment.production) {
			var str;
			if(Array.isArray(content)) {
				if(TravlendarUtils.logStringify) {
					str = '(Array length ' + content.length + ') [';

					if(content.length == 0) {
						str += ']';
					} else {
						for(var i = 0; i < content.length; i++) {
							str += JSON.stringify(content[i]) + (i == content.length - 1 ? ']' : ', ');
						}
					}
					content = null;
				} else {
					str = '(Array length ' + content.length + ') - See below ';
				}
			}
			else if(typeof content === 'object') {
				if(TravlendarUtils.logStringify) {
					str = '(Object) ' + JSON.stringify(content);
					content = null;
				} else {
					str = '(Object) - See below ';
				}
			}
			else if(typeof content === 'string') {
				str = content;
				content = null;
			}
			else if (typeof content === 'number') {
				str = content;
				content = null;
			}
			else if (typeof content === 'boolean') {
				str = content;
				content = null;
			}
			else {
				str = '';
			}

			if(!file && !level) {
				console.log('[LOG]:\t' + str);
			}
			else if(!level) {
				if(TravlendarUtils.logDisplayFilename)
					console.log('[LOG] ' + (typeof file === 'string' ? file : file.constructor.name) + ':\t' + str);
				else
					console.log('[LOG]:\t' + str);
			}
			else {
				if(TravlendarUtils.logDisplayFilename)
					console.log('[' + level + '] ' + (typeof file === 'string' ? file : file.constructor.name) + ':\t' + str);
				else
					console.log('[' + level + ']:\t' + str);
			}

			if(content != null)
				console.log(content);
		}
	}

	static getHeaders () {
		let httpOptions = new HttpHeaders();
		httpOptions = httpOptions.append('Authorization', sessionStorage.getItem('access_token'));
		httpOptions = httpOptions.append('Content-type', 'application/json');

		return httpOptions;
	}

	static setSessionAccessToken (authorization) {
		sessionStorage.setItem('access_token', authorization);
	}

	static getRandomHash(length) {
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for (var i = 0; i < length; i++)
			text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	}
};
