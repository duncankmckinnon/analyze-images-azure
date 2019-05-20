#!/usr/bin/env node

require('dotenv').config();
const request = require('request');
const inquirer = require('inquirer');
const fs = require('fs');

// fill with corporate proxy (optional)
const corporate_proxy = process.env.CORPORATE_PROXY;

// fill with your computer vision region
const region = process.env.REGION; 

//fill with your computer vision subscriptionKey 
const subscriptionKey = process.env.SUBSCRIPTION_KEY;

const uriBase = `https://${region}.api.cognitive.microsoft.com/vision/v2.0`;

const questions = [
	{
		type : 'input',
		name : 'url',
		message : 'image URL: '
	},
	{
		type : 'checkbox',
		name : 'request_type',
		message : 'Computer Vision Request Types: ',
		choices : [
			{name : 'analyze', checked : true},
			{name : 'ocr'},
			{name : 'describe'},
			{name : 'tag'}
		]
	},
	{
		type : 'checkbox',
		name : 'analyze_types',
		message : 'Analyze Request Options: ',
		choices : [
			{name : 'Description', checked : true},
			{name : 'Categories'},
			{name : 'Tags'}, 
			{name : 'Objects'},
			{name : 'Faces'},
			{name : 'Brands'},
			{name : 'Color'},
			{name : 'ImageType'}
		],
		when: (answers) => { return( answers.request_type.includes('analyze') ) }
	},
	{
		type : 'checkbox',
		name : 'analyze_details',
		message : 'Anayze Request Details: ',
		choices : [
			{name : 'Celebrities'},
			{name : 'Landmarks'}
		],
		when: (answers) => { return( answers.request_type.includes('analyze') ) }
	},
	{
		type : 'list',
		name : 'lang',
		message : 'Response Language: ',
		choices : ['en', 'es', 'jp', 'pt', 'zh']
	},
	{
		type : 'input',
		name : 'fname',
		message : 'Filename to write to (optional): ',
		default : null,
		when: (answers) => { return( answers.request_type.includes('analyze') ) }
	}
];

inquirer.prompt(questions).then(answers => {
	for( let i=0;i < answers.request_type.length; i++ ){
		let params = { };
		switch(answers.request_type[i]){
			case 'analyze':
				params.visualFeatures = answers.analyze_types.toString();
				params.details = answers.analyze_details.toString();
				params.language = answers.lang;
			case 'ocr':
				params.detectOrientation = true;
				params.language = answers.lang;
			default:
				params.language = answers.lang;
		}
		let options = {
			uri: `${uriBase}/${answers.request_type[i]}`,
			proxy: corporate_proxy, 
			qs: params,
			body: '{"url": ' + '"' + answers.url + '"}',
			headers: {
				'Content-Type': 'application/json',
				'Ocp-Apim-Subscription-Key' : subscriptionKey
			}
		};

		request.post(options, (error, response, body) => {
			if (error) {
				console.log('Error: ', error);
				return;
			}
			let parse_body = JSON.parse(body);
			let caption = parse_body;
			let jsonResponse = JSON.stringify(caption, null, '  ');
			console.log(jsonResponse);
			
			if( answers.fname ) {
				fs.appendFile(`bin/image_responses/${answers.fname}.json`, jsonResponse, 'utf8', (err) => {
					if (err) throw err;
				});
			}
		});
	}
 });



