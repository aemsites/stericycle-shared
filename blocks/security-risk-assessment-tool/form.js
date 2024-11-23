
import React, { useState, useEffect, useRef } from 'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm';
import ReactDOM from 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/+esm';
import axios from 'https://esm.sh/axios@0.21.4';
import htm from 'https://esm.sh/htm';

import PDFLink from './PDFLink.js';
import CustomLoader from "./Oval.js";

import masking from './maskedInputs.js';

const html = htm.bind(React.createElement);
const heroBanner = '../../icons/securityrisk-Hero-Banner.png';
const contentImageA = '../../icons/securityrisk-main.png';
const contentImageB = '../../icons/securityrisk-quote.png';
const securityRiskCan = '../../icons/securityrisk-can.png';

const SecurityRiskAssessmentTool = ({
  mapQuestions,
  customerInfo,
  isCustomer = true,
  isCa,
  prepopulated,
  generalScorePreloaded,
}) => {
  const phonePattern = '^(\\(\\d{3}\\) |\\d{3})?\\d{3}-?\\d{4}$';
  let postalCodeHandler = 'postalCode';
  let defaultZipLength = 5;
  let placeHolderZipcode = '_____';
  let labelZipcode = 'Zip Code';
  let zipCodePattern = '^[0-9]{5}(?:\s)?(?:-[0-9]{4})?$';
  let constraintMessage = 'Please enter a valid five-digit zip code (ex. 12345 or 12345-1234)';
  if (isCa) {
    zipCodePattern = '^[ABCEGHJ-NPRSTVXY][0-9][ABCEGHJ-NPRSTV-Z] [0-9][ABCEGHJ-NPRSTV-Z][0-9]$';
    constraintMessage = 'Please enter a valid six-digit postal code (ex. A1B 2C3)';
    postalCodeHandler = 'CAPostalCode';
    defaultZipLength = 7;
    placeHolderZipcode = '___ ___';
    labelZipcode = 'Postal Code';
  }

  const telRef = useRef(null);
  const zipRef = useRef(null);

  const [recommendations, setRecommendations] = useState({
    serviceRecommended: '',
    consoleService: '',
    frequency: '',
    training: '',
  });
  const [steps, setSteps] = useState({
    multiplier: 1,
    isCustomer: true,
    showSplash: true,
    showResult: false,
    spinner: false,
    piiComplete: false,
  });
  const [hipaaVisible, showHipaa] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [score, updateScore] = useState({
    hipaa: 0,
    osha: 0,
    shredding: false,
    drugDisposal: false,
  });
  const [userInfo, updateUserInfo] = useState({
    date: undefined,
    companyName: undefined,
    conductedFor: undefined,
    firstName: undefined,
    lastName: undefined,
    emailAddress: undefined,
    phoneNumber: undefined,
    zipCode: undefined,
  });
  const [selection, makeSelection] = useState({
    selectionIndex: 0,
    selectionValue: null,
  });
  const [submitEnabled, enableSubmit] = useState(false);
  const [generalScore, updateGeneralScore] = useState(generalScorePreloaded);
  window.dataLayer = window.dataLayer || [];

  useEffect(() => {
    if (customerInfo) {
      updateUserInfo({ ...customerInfo });
    }
  }, [customerInfo]);

  useEffect(() => {
    if (mapQuestions && mapQuestions.length) {
      setQuestions(mapQuestions);
    }
  }, [mapQuestions]);

  useEffect(() => {
    // if the user isn't a customer (has #salesAccess in url) send them to the custom agent screen
    setSteps({ ...steps, isCustomer, piiComplete: prepopulated });
  }, [isCustomer]);

  useEffect(() => {
    if (telRef.current) {
      masking.init(telRef.current);
    }

    if (zipRef.current) {
      masking.init(zipRef.current);
    }
  }, [telRef, zipRef]);

  useEffect(() => {
    if (questions && questions.length) {
      const { selectionIndex, selectionValue } = selection;
      const { hasScore } = questions[selectionIndex];
      if (hasScore && (selectionValue === Granite.I18n.get('Yes') || selectionValue === Granite.I18n.get('Shredding Provider'))) {
        updateGeneralScore(generalScore + questions[selectionIndex].score);
      } else if (questions[selectionIndex].userSelection.length > 0) {
        updateGeneralScore(generalScore - questions[selectionIndex].score);
      }
      questions[selectionIndex].userSelection = selectionValue;
      if (questions[selectionIndex].order === 3 && (selectionValue === Granite.I18n.get('In-house Paper Shredders') || selectionValue === Granite.I18n.get('None') || selectionValue == Granite.I18n.get('Other'))) {
        questions[selectionIndex + 3].visible = true;
        questions[selectionIndex + 1].visible = false;
      } else if (questions[selectionIndex].order === 3) {
        questions[selectionIndex + 3].visible = false;
        questions[selectionIndex + 1].visible = true;
      } else if (questions[selectionIndex].order === 4 && selectionValue === Granite.I18n.get('Regular')) {
        questions[selectionIndex + 2].visible = false;
        questions[selectionIndex + 3].visible = false;
        questions[selectionIndex + 1].visible = true;
      } else if (questions[selectionIndex].order === 4 && selectionValue === Granite.I18n.get('One-Time')) {
        questions[selectionIndex + 3].visible = true;
        questions[selectionIndex + 2].visible = false;
        questions[selectionIndex + 1].visible = false;
      } else if (questions[selectionIndex].order === 4 && selectionValue === Granite.I18n.get('No/Unsure')) {
        questions[selectionIndex + 3].visible = false;
        questions[selectionIndex + 2].visible = true;
        questions[selectionIndex + 1].visible = false;
      } else if (questions[selectionIndex].order === 5 || questions[selectionIndex].order === 6 || questions[selectionIndex].order === 7) {
        questions[7].visible = true;
      } else if (questions[selectionIndex].order != questions.length) {
        questions[selectionIndex + 1].visible = true;
      } else {
        enableSubmit(true);
      }
      setTimeout(() => {
        scrollToEndQuestionFlow();
      }, 50);
      setQuestions((questions) => [...questions]);
    }
  }, [selection]);

  const evaluateRecommendations = (questions) => {
    let serviceType1 = '';
    // Scenario 1
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('Regular'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
           || (questions[9].userSelection === Granite.I18n.get('Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service'),
      }));

      serviceType1 = 'Regular';
    }
    // Scenario 2
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('Regular'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
           || (questions[9].userSelection === Granite.I18n.get('Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Specialty Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }
    // Scenario 3
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('Regular'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
           || (questions[9].userSelection === Granite.I18n.get('Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Regular';
    }
    // Scenario 4
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('Regular'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
           || (questions[9].userSelection === Granite.I18n.get('Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Specialty Shredding Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Regular';
    }
    // Scenario 5
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('One-Time'))
       && (
         questions[6].userSelection === '1'
           || questions[6].userSelection === '2'
           || questions[6].userSelection === '3'
       )
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
           || (questions[9].userSelection === Granite.I18n.get('Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 6
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('One-Time'))
       && (
         questions[6].userSelection === '1'
           || questions[6].userSelection === '2'
           || questions[6].userSelection === '3'
       )
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Services'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 7
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('One-Time'))
       && (
         questions[6].userSelection === '1'
           || questions[6].userSelection === '2'
           || questions[6].userSelection === '3'
       )
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }
    // Scenario 8
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('One-Time'))
       && (
         questions[6].userSelection === '1'
           || questions[6].userSelection === '2'
           || questions[6].userSelection === '3'
       )
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Service, and Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 9
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('One-Time'))
       && (
         questions[6].userSelection === '4'
           || questions[6].userSelection === '5'
           || questions[6].userSelection === '6'
           || questions[6].userSelection === '7'
           || questions[6].userSelection === '8'
           || questions[6].userSelection === '9'
           || questions[6].userSelection === '10+'
       )
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
           || (questions[9].userSelection === Granite.I18n.get('Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 10
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('One-Time'))
       && (
         questions[6].userSelection === '4'
           || questions[6].userSelection === '5'
           || questions[6].userSelection === '6'
           || questions[6].userSelection === '7'
           || questions[6].userSelection === '8'
           || questions[6].userSelection === '9'
           || questions[6].userSelection === '10+'
       )
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
           || (questions[9].userSelection === Granite.I18n.get('Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Specialty Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 11
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('One-Time'))
       && (
         questions[6].userSelection === '4'
           || questions[6].userSelection === '5'
           || questions[6].userSelection === '6'
           || questions[6].userSelection === '7'
           || questions[6].userSelection === '8'
           || questions[6].userSelection === '9'
           || questions[6].userSelection === '10+'
       )
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
           || (questions[9].userSelection === Granite.I18n.get('Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 12
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('One-Time'))
       && (
         questions[6].userSelection === '4'
           || questions[6].userSelection === '5'
           || questions[6].userSelection === '6'
           || questions[6].userSelection === '7'
           || questions[6].userSelection === '8'
           || questions[6].userSelection === '9'
           || questions[6].userSelection === '10+'
       )
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
           || (questions[9].userSelection === Granite.I18n.get('Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Specialty Shredding Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 13
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
           || (questions[9].userSelection === Granite.I18n.get('Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 14
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
           || (questions[9].userSelection === Granite.I18n.get('Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Specialty Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 15
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
           || (questions[9].userSelection === Granite.I18n.get('Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 16
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
           || (questions[9].userSelection === Granite.I18n.get('Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Specialty Shredding Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Regular';
    }
    // Scenario 17
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 18
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Services'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 19
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 20
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Service, and Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 21
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Other'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Hard Drive Destruction Service, Specialty Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 22
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Other'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Service, and Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 23
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Other'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Services'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 24
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Other'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
           || (questions[9].userSelection === Granite.I18n.get('Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
          || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
          || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 25
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Other'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
          || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
          || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }
    // Scenario 26
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Other'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 27
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Other'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
           || (questions[9].userSelection === Granite.I18n.get('Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Specialty Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 28
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Other'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
           || (questions[9].userSelection === Granite.I18n.get('Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
           || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 29
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('None'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
          || (questions[9].userSelection === Granite.I18n.get('Weekly'))
          || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
          || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Hard Drive Destruction Service, Specialty Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 30
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('None'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Service, and Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 31
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('None'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Services'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 32
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('None'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
          || (questions[9].userSelection === Granite.I18n.get('Weekly'))
          || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
          || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 33
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('None'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 34
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('None'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 35
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('None'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Specialty Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 36
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('None'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 37
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('In-house Paper Shredders'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Hard Drive Destruction Service, Specialty Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 38
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('In-house Paper Shredders'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Services'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 39
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('In-house Paper Shredders'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Service, and Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 40
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('In-house Paper Shredders'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 41
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('In-house Paper Shredders'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 42
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('In-house Paper Shredders'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 43
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('In-house Paper Shredders'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Specialty Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 44
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('In-house Paper Shredders'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 45
    if ((questions[0].userSelection === Granite.I18n.get('Residential'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 46
    if ((questions[0].userSelection === Granite.I18n.get('Residential'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 47
    if ((questions[0].userSelection === Granite.I18n.get('Residential'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Services'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 48
    if ((questions[0].userSelection === Granite.I18n.get('Residential'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Service, and Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 49
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('Regular'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 50
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('Regular'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Specialty Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 51
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('Regular'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 52
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('Regular'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Specialty Shredding Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 53
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('One-Time'))
       && (
         questions[6].userSelection === '1'
           || questions[6].userSelection === '2'
           || questions[6].userSelection === '3'
       )
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 54
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('One-Time'))
       && (
         questions[6].userSelection === '1'
           || questions[6].userSelection === '2'
           || questions[6].userSelection === '3'
       )
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Services'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 55
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('One-Time'))
       && (
         questions[6].userSelection === '1'
           || questions[6].userSelection === '2'
           || questions[6].userSelection === '3'
       )
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 56
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('One-Time'))
       && (
         questions[6].userSelection === '1'
           || questions[6].userSelection === '2'
           || questions[6].userSelection === '3'
       )
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Service, and Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 57
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('One-Time'))
       && (
         questions[6].userSelection === '4'
           || questions[6].userSelection === '5'
           || questions[6].userSelection === '6'
           || questions[6].userSelection === '7'
           || questions[6].userSelection === '8'
           || questions[6].userSelection === '9'
           || questions[6].userSelection === '10+'
       )
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 58
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('One-Time'))
       && (
         questions[6].userSelection === '4'
           || questions[6].userSelection === '5'
           || questions[6].userSelection === '6'
           || questions[6].userSelection === '7'
           || questions[6].userSelection === '8'
           || questions[6].userSelection === '9'
           || questions[6].userSelection === '10+'
       )
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Specialty Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 59
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('One-Time'))
       && (
         questions[6].userSelection === '4'
           || questions[6].userSelection === '5'
           || questions[6].userSelection === '6'
           || questions[6].userSelection === '7'
           || questions[6].userSelection === '8'
           || questions[6].userSelection === '9'
           || questions[6].userSelection === '10+'
       )
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 60
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('One-Time'))
       && (
         questions[6].userSelection === '4'
           || questions[6].userSelection === '5'
           || questions[6].userSelection === '6'
           || questions[6].userSelection === '7'
           || questions[6].userSelection === '8'
           || questions[6].userSelection === '9'
           || questions[6].userSelection === '10+'
       )
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Specialty Shredding Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 61
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 62
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Specialty Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 63
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 64
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Specialty Shredding Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 65
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
              && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 66
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Services'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 67
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
        && (
          (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
        )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 68
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
        && (
          (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
        )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Service, and Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 69
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Other'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Hard Drive Destruction Service, Specialty Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 70
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Other'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Service, and Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 71
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Other'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Services'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 72
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Other'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 73
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Other'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 74
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Other'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 75
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('None'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
            || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
            || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Hard Drive Destruction Service, Specialty Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 76
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('None'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
            || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
            || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Service, and Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 77
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('None'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Services'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 78
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('None'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
            || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
            || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 79
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('None'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
            || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
            || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 80
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('None'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 81
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('In-house Paper Shredders'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
            || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
            || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Hard Drive Destruction Service, Specialty Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 82
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('In-house Paper Shredders'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Services'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 83
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('In-house Paper Shredders'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
            || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
            || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Service, and Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 84
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('In-house Paper Shredders'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
            || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
            || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 85
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('In-house Paper Shredders'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
            || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
            || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 86
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('In-house Paper Shredders'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (questions[9].userSelection === Granite.I18n.get('Bi-Monthly'))
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 87
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Other'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Specialty Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 88
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('Other'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 89
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('None'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Specialty Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 90
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('None'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 91
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('In-house Paper Shredders'))
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service, Specialty Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 92
    if ((questions[0].userSelection === Granite.I18n.get('Business run from residential property'))
       && (questions[2].userSelection === Granite.I18n.get('In-house Paper Shredders'))
       && (questions[7].userSelection === Granite.I18n.get('No/Unsure'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('Regular Shredding Service'),
      }));
      serviceType1 = 'Regular';
    }

    // Scenario 93
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('One-Time'))
          && (
            questions[6].userSelection === '1'
              || questions[6].userSelection === '2'
              || questions[6].userSelection === '3'
          )
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (questions[22].userSelection === Granite.I18n.get('Never'))) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Services'),
      }));
      serviceType1 = 'Purge';
    }

    // Scenario 94
    if ((questions[0].userSelection === Granite.I18n.get('Business'))
       && (questions[2].userSelection === Granite.I18n.get('Shredding Provider'))
       && (questions[3].userSelection === Granite.I18n.get('One-Time'))
          && (
            questions[6].userSelection === '1'
              || questions[6].userSelection === '2'
              || questions[6].userSelection === '3'
          )
       && (questions[7].userSelection === Granite.I18n.get('Yes'))
       && (
         (questions[9].userSelection === Granite.I18n.get('Daily'))
            || (questions[9].userSelection === Granite.I18n.get('Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Bi-Weekly'))
            || (questions[9].userSelection === Granite.I18n.get('Monthly'))
       )
       && (
         (questions[22].userSelection === Granite.I18n.get('Annually'))
           || (questions[22].userSelection === Granite.I18n.get('2-5 years'))
           || (questions[22].userSelection === Granite.I18n.get('5+ years'))
       )) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        serviceRecommended: Granite.I18n.get('One-time Shredding Service or Drop-off Service, Specialty Shredding Service, and Hard Drive Destruction Service'),
      }));
      serviceType1 = 'Purge';
    }

    return serviceType1;
  };

  const evaluateServices = () => {
    let trainingCount = 0;
    questions.forEach((value, index) => {
      if (value.typeSection === 'training' && value.userSelection === Granite.I18n.get('No/Unsure')) trainingCount++;
      if (value.order === 10) {
        setRecommendations((recommendations) => ({
          ...recommendations,
          frequency: value.userSelection,
        }));
      }
    });
    const serviceType = evaluateRecommendations(questions);
    if (trainingCount > 2) {
      setRecommendations((recommendations) => ({
        ...recommendations,
        training: 'P&I Option',
      }));
    } else {
      setRecommendations((recommendations) => ({
        ...recommendations,
        training: 'N/A',
      }));
    }
    const questionEight = questions[8].userSelection;
    let questionEightValue = 0;
    const questionFour = questions[4].userSelection;
    let questionFourValue = 0;
    if (questionFour.length === 0) questionFourValue = 0;
    else if (questionFour === '1') questionFourValue = 1;
    else if (questionFour === '2-5') questionFourValue = 3;
    else if (questionFour === '10+') questionFourValue = 10;
    if (questionEight === '') questionEightValue = 0;
    else if (questionEight === '10+') questionEightValue = 10;
    if (questionEightValue !== 10 || questionEight !== '') questionEightValue = parseInt(questionEight);
    setRecommendations((recommendations) => ({
      ...recommendations,
      consoleService: Math.max(questionEightValue, questionFourValue),
    }));
    return serviceType;
  };

  const scrollToEndQuestionFlow = () => {
    const questionContent = document.querySelector('#contentquestionFlow');
    if (questionContent) {
      questionContent.scrollTo(0, questionContent.scrollHeight);
    }
  };

  const onChangeForm = (opts) => {
    setSteps((steps) => ({
      ...steps,
      ...opts,
    }));
  };

  const handleSubmit = (e) => {
    const userSelections = [];
    e.preventDefault();
    setSteps({ ...steps, spinner: true, showResult: false, showSplash: false });
    const serviceType = evaluateServices();
    window.scrollTo(0, 0);
    setTimeout(() => {
      setSteps((steps) => ({
        ...steps,
        spinner: false,
        showResult: true,
      }));
    }, 2000);

    questions.forEach((val, index) => {
      userSelections.push(`ct_${val.order}=${encodeURIComponent(Granite.I18n.get(val.userSelection))}`);
    });

    userSelections.push(
      Object.keys(userInfo)
        .map((key) => `${key}=${userInfo[key]}`)
        .join('&'),
    );
    submitInformation(userSelections, serviceType);
  };

  const submitInformation = (userSelections, serviceType) => {
    let sidFormData = new FormData();
    const method = 'post';
    let action = '';
    const phoneNumber = userInfo.phoneNumber?.replace(/[&\/\\#,+)( $~%.'":*?<>{}-]/g, '');

    if (isCustomer) {
      const form = document
        .querySelector('input[value="CUSIT"]')
        ?.closest('form');
      action = form?.action;
      sidFormData = new FormData(form);
      sidFormData.append('first_name', userInfo.firstName);
      sidFormData.append('last_name', userInfo.lastName);
      sidFormData.append('company', userInfo.companyName);
      sidFormData.append('email', userInfo.emailAddress);
      sidFormData.append('industry', '');
      sidFormData.append('city', '');
      sidFormData.append('country', '');
      sidFormData.append('serviceType1', serviceType);
      sidFormData.append('phone', phoneNumber);
      sidFormData.append('zip', userInfo.zipCode);
      sidFormData.append(
        'formComments',
        `${document.location.origin
        + document.location.pathname
        }?${
          userSelections.join('&')
        }#salesAccess`,
      );
    } else {
      const form = document
        .querySelector('input[value="SUBSSID"]')
        ?.closest('form');
      action = form?.action;
      sidFormData = new FormData(form);
      sidFormData.append('first_name', userInfo.firstName);
      sidFormData.append('last_name', userInfo.lastName);
      sidFormData.append('company', userInfo.companyName);
      sidFormData.append('email', userInfo.emailAddress);
      sidFormData.append('phone', phoneNumber);
      sidFormData.append('zip', userInfo.zipCode);
      sidFormData.append('salesrepname', userInfo.firstName);
      sidFormData.append('salesrepphone', userInfo.firstName);
      sidFormData.append('sFDCLeadID', '');
      sidFormData.append(
        'formComments',
        `${document.location.origin
        + document.location.pathname
        }?${
          userSelections.join('&')
        }#salesAccess`,
      );
    }

    axios({
      method,
      url: action,
      data: sidFormData,
    }).then((response) => {
      console.log(response);
    }).catch((response) => {
      console.error(response);
    });
  };

  const atLeastOneOptionChecked = (radios) => Array.from(radios).some((option) => option.checked);

  const onInput = (event) => {
    let parent = event.target?.parentElement;
    const required = parent.querySelector('.cmp-form-text__required-block');
    const constraint = parent.querySelector('.cmp-form-text__constraint-block');

    required?.classList.remove('show');
    constraint?.classList.remove('show');
    parent?.classList.remove('is-invalid');
    event.target.classList.remove('is-invalid');

    if (event.target.type === 'radio') {
      parent = parent.parentElement;
      const parentRequired = parent.querySelector('.cmp-form-text__required-block');

      parent?.classList.remove('is-invalid');
      parentRequired?.classList.remove('show');
    }

    if (event.target.dataset.type === 'tel'
      || event.target.dataset.type === 'postalCode'
      || event.target.dataset.type === 'CAPostalCode') {
      masking.activateMasking(event);
    }
  };

  const onFocus = (event) => {
    event.target.parentElement?.classList.add('focus');

    if (event.target.dataset.type === 'tel' && event.target.value == '') {
      event.target.value = '(';
    }
  };

  const onError = (event) => {
    let parent = event.target?.parentElement;
    const required = parent.querySelector('.cmp-form-text__required-block');
    const constraint = parent.querySelector('.cmp-form-text__constraint-block');
    event.target.parentElement.classList.remove('focus');

    if (event.target.dataset.type === 'email') {
      const pattern = event.target.getAttribute('pattern');

      if (pattern && event.target.value !== '') {
        if (!new RegExp(pattern).test(event.target.value)) {
          event.target.setCustomValidity('invalid email');
        } else {
          event.target.setCustomValidity('');
        }
      }
    }

    if (event.target.type === 'radio') {
      parent = parent.parentElement;
      const radios = parent.querySelectorAll('input');
      const parentRequired = parent.querySelector('.cmp-form-text__required-block');

      if (!atLeastOneOptionChecked(radios)) {
        parent?.classList.add('is-invalid');
        parentRequired?.classList.add('show');
      }
    }

    if (event.target.value === 'default') {
      event.target.classList.add('is-invalid');

      parent?.classList.add('is-invalid');
      required?.classList.add('show');
    }

    if (event.target.validity.typeMismatch
      || event.target.validity.patternMismatch
      || event.target.validity.rangeOverflow
      || event.target.validity.customError) {
      event.target.classList.add('is-invalid');

      constraint?.classList.add('show');
      parent?.classList.add('is-invalid');

      if (event.target.dataset.type === 'postalCode'
      || event.target.dataset.type === 'tel'
      || event.target.dataset.type === 'CAPostalCode') {
        if (event.target.value.length === 1 && event.target.dataset.type === 'tel') {
          event.target.value = '';
          event.target.classList.add('is-invalid');
          parent?.classList.add('is-invalid');
          constraint?.classList.remove('show');
          required?.classList.add('show');
        } else if (event.target.value.length > 1) {
          parent.classList.add('focus');
        }
      }
    } else if (event.target.validity.valueMissing) {
      event.target.classList.add('is-invalid');

      parent?.classList.add('is-invalid');
      required?.classList.add('show');
    }
  };

  const buildSelectOptions = (options) => {
    // function to process the select dropdown options that are defined in questions.json
    const selectOptionArr = [
      html`<option key="default" value="default" disabled hidden>
        ${Granite.I18n.get("Select One")}
      </option>`,
    ];
    for (const value of options) {
      selectOptionArr.push(
        html`<option key={value} value={value}>
          ${Granite.I18n.get(value)}
        </option>`,
      );
    }
    return selectOptionArr;
  };

  const handlePIISubmit = (e) => {
    e.preventDefault();
    const parentForm = e.target.closest('form');
    const formData = new FormData(parentForm);

    if (parentForm.checkValidity()) {
      isCustomer
        && onChangeForm({
          showSplash: false,
          piiComplete: true,
        });
      !isCustomer
        && onChangeForm({
          piiComplete: true,
        });
    }
    window.scrollTo(0, 0);
  };

  const handleInputChange = (event) => {
    const currentValue = event.target.value;
    const date = new Date();
    const formattedDate = `${(`0${date.getMonth() + 1}`).slice(-2)}/${(`0${date.getDate()}`).slice(-2)}/${date.getFullYear()}`;
    updateUserInfo({
      ...userInfo,
      [event.target.name]: currentValue,
      date: formattedDate,
    });
  };

  const renterInputRadio = (index, key, value) => html`<div className="mb-2 mt-2 input-content" key=${key}>
      <label htmlFor=${key} className="cmp-title__text ss-font-color--primary mb-2">
        ${Granite.I18n.get(value.title)}
      </label>
      <div className="row">
        <div className="col-auto">
          <input
            className="m-1"
            type="radio"
            id=${`q-${key}-${Granite.I18n.get(value.options[0])}`}
            name=${key}
            disabled=${!isCustomer}
            checked=${Granite.I18n.get(value?.options[0]) == Granite.I18n.get(value?.userSelection)}
            onBlur=${onError}
            onChange=${(e) => {
    onInput(e);
    makeSelection({
      selectionIndex: index,
      selectionValue: Granite.I18n.get(value.options[0]),
    });
  }}
            value=${Granite.I18n.get(value.options[0])}
          />
          <label
            className="m-1"
            htmlFor=${`q-${key}-${Granite.I18n.get(value.options[0])}`}
          >
            ${Granite.I18n.get(value.options[0])}
          </label>
        </div>
        <div className="col-auto">
          <input
            className="m-1"
            type="radio"
            id=${`q-${key}-${Granite.I18n.get(value.options[1])}`}
            name=${key}
            disabled=${!isCustomer}
            checked=${Granite.I18n.get(value?.options[1]) == Granite.I18n.get(value?.userSelection)}
            onChange=${(e) => {
    onInput(e);
    makeSelection({
      selectionIndex: index,
      selectionValue: Granite.I18n.get(value.options[1]),
    });
  }}
            value=${Granite.I18n.get(value.options[1])}
          />
          <label
            className="m-1"
            htmlFor=${`q-${key}-${Granite.I18n.get(value.options[1])}`}
          >
            ${Granite.I18n.get(value.options[1])}
          </label>
        </div>
        <p className="cmp-form-text__required-block">${Granite.I18n.get('This choice is required')}</p>
      </div>
    </div>`;

  const renderResultsFromGeneralScore = () => {
    if (generalScore > 160) {
      return html`<div className="low-risk mb-4">
        <h3>${Granite.I18n.get('Low risk for Security Data Breach')}</h3>
        <p>${Granite.I18n.get("You seem to have a good handle on your organization's confidential information and appear to have a low risk for an information breach. However, you should still be vigilant when it comes to protecting your information security and there are a few things you should do to further secure your confidential information and protect your organization from risk in the future.")}</p>
      </div>`;
    } if ((generalScore > 100) && (generalScore <= 160)) {
      return html`<div className="moderate-risk mb-4">
        <h3>${Granite.I18n.get('Moderate risk for Security Data Breach')}</h3>
        <p>${Granite.I18n.get("While your organization's confidential information security is strong in some areas, you appear to have a medium risk for an information breach which means there are weaknesses. It's important to take measures as soon as possible to secure your confidential information and protect one of your most important assets: your information.")}</p>
      </div>`;
    } if (generalScore <= 100) {
      return html`<div className="high-risk mb-4">
        <h3>${Granite.I18n.get('High risk for Security Data Breach')}</h3>
        <p>${Granite.I18n.get("There are gaps in your organization's confidential information security that should be addressed. It's important to take measures as soon as possible to reduce your risk and protect your organization's confidential information from getting into the wrong hands.")}</p>
      </div>`;
    }
  };

  const renderInputSelect = (index, key, value) => html`<div className="mb-2 mt-2 input-content" key=${key}>
      <label htmlFor=${key} className="cmp-title__text ss-font-color--primary mb-2">
        ${Granite.I18n.get(value.title)}
      </label>

      <div>
        <select
          name=${key}
          tabIndex=${0}
          disabled=${!isCustomer}
          defaultValue=${value?.userSelection || 'default'}
          onBlur=${onError}
          onChange=${(e) => {
    onInput(e);
    makeSelection({
      selectionIndex: index,
      selectionValue: Granite.I18n.get(e.target.selectedOptions[0]?.label),
    });
  }}
        >
          ${buildSelectOptions(Granite.I18n.get(questions[index].options))}
        </select>
        <p className="cmp-form-text__required-block">${Granite.I18n.get('This choice is required')}</p>
      </div>
    </div>`;

  const renderInputNumber = (index, key, value) => html`<div className="mb-2 mt-2 input-content" key=${key}>
      <label htmlFor=${key} className="cmp-title__text ss-font-color--primary mb-2">
        ${Granite.I18n.get(value.title)}
      </label>
      <div>
        <input
          type="number"
          name=${key}
          min="10" max="100"
          value=${value?.userSelection}
          onChange=${(e) => makeSelection({
    selectionIndex: index,
    selectionValue: e.target.value,
  })
}
        />
      </div>
    </div>`;

  const renderInputs = () => {
    // function to build the questions that will be displayed in the question flow
    // the data/attributes of each question displayed is defined in questions.json
    // each item in the questions array is processed and added in order to arrOfInputs, which is returned
    const arrOfInputs = [];
    if (questions && questions.length > 0 && Object.keys(questions).length) {
      questions.forEach((value, index) => {
        const key = questions[index].order;
        if (
          questions[index].visible
        ) {
          if (value.inputType === 'radio') {
            arrOfInputs.push(renterInputRadio(index, key, value));
          } else if (value.inputType === 'select') {
            arrOfInputs.push(renderInputSelect(index, key, value));
          } else if (value.inputType === 'number') {
            arrOfInputs.push(renderInputNumber(index, key, value));
          }
        } else {
          return html`<div className="cmp-securityriskassessmenttool-inputs-item show cmp-form-text col-lg-12">
              <span className="cmp-title__text">${Granite.I18n.get('Sorry')}</span>
            </div>`;
        }
      });
    }
    return arrOfInputs;
  };

  return html`
   <div className="cmp-securityriskassessmenttool-wrapper">
      <div className="cmp-securityriskassessmenttool-header">
        <img src=${heroBanner} className="cmp-securityriskassessmenttool-header__hero" />
         <h1 className="cmp-securityriskassessmenttool-header__hero-title">
            ${Granite.I18n.get('Information Security Risk Assessment')}
         </h1>
      </div>

      <div
        className="cmp-securityriskassessmenttool-content"
        data-user=${steps.isCustomer ? 'customer' : 'employee'}
      >
        ${!steps.showResult && steps.showSplash && html`
          <div className="cmp-securityriskassessmenttool-splash container">
            <div className="columnrow aem-GridColumn aem-GridColumn--default--12">
              ${steps.isCustomer && html`
                <div className="row cmp-columnrow justify-content-around mb-4 mt-4">
                  <div
                    className="col-lg-12 cmp-columnrow__item"
                    data-cmp-hook-columnrow="item"
                  >
                    <div className="contentcontainer">
                      <div
                        id="contentcontainer-48c73f7378"
                        className="cmp-container"
                      >
                        <div className="cmp-text">
                          <p>
                            ${Granite.I18n.get(
    'With increasingly sophisticated attempts to steal confidential information and ever-changing regulations, it’s more difficult than ever to ensure your organization’s information is protected and managed in a compliant way.',
  )}
                          </p>
                          <p>
                            ${Granite.I18n.get("Shred-it's proprietary Information Security Risk Assessment tool helps identify potential risks for theft and non-compliance in your organizations information management programs by evaluating your current policies, procedures, trainings, and documentation; and provide you with a quantifiable estimate of those risks to your organization. From there, our local representatives can help you determine the best approach to address any concerns and protect your organization.")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `}
              <div className="row cmp-columnrow">
                ${steps.isCustomer && html`
                  <div className="col-lg-4 d-none d-lg-block">
                    <img src=${contentImageA} width="400" />
                  </div>
                `}
                <div
                  className="col cmp-columnrow__item"
                  data-cmp-hook-columnrow="item"
                >
                  <div className="contentcontainer">
                    <div
                      id="contentcontainer-48c73f7378"
                      className="cmp-container"
                    >
                      <div className="contentcontainer">
                        <div className="cmp-container">
                          <form
                            autoComplete="on"
                            name="securityRiskAssessment"
                            onSubmit=${handlePIISubmit}
                          >
                            <div className="text ss-font-color--secondary ss-vertical-space--top-x1 aem-GridColumn aem-GridColumn--default--12">
                              <div>
                                <p><b>
                                  ${Granite.I18n.get(
    'Information Security Risk Assessment',
  )}
                                </b></p>
                                <p>
                                  ${' '}
                                  ${Granite.I18n.get(
    "Interested in assessing your facility's information security risk? Complete your assessment in less than 5 minutes.",
  )}
                                  <br />
                                </p>
                              </div>
                            </div>
                            <div className="row">
                              <div className="text col-md-6 aem-GridColumn aem-GridColumn--default--6">
                                <div
                                  className="cmp-form-text form-floating"
                                  data-cmp-required-message="(Required)"
                                >
                                  <input
                                    className="cmp-form-text__text form-control"
                                    data-cmp-hook-form-text="input"
                                    type="text"
                                    autoComplete="organization"
                                    id="form-text-companyName"
                                    placeholder="Company Name"
                                    readOnly=${!isCustomer}
                                    name="companyName"
                                    value=${userInfo.companyName}
                                    onBlur=${onError}
                                    onInvalid=${onError}
                                    onInput=${onInput}
                                    onChange=${handleInputChange}
                                    required
                                  />
                                  <label htmlFor="form-text-companyName">
                                    ${Granite.I18n.get('Company Name')}
                                    <span className="cmp-form-text--asterisk">*</span>
                                  </label>
                                  <p className="cmp-form-text__required-block">${Granite.I18n.get('This field is required')}</p>
                                </div>
                              </div>
                              <div className="text col-md-6 aem-GridColumn aem-GridColumn--default--12">
                                <div
                                  className="cmp-form-text form-floating"
                                  data-cmp-required-message="(Required)"
                                >
                                  <input
                                    ref=${zipRef}
                                    className="cmp-form-text__text form-control"
                                    data-cmp-hook-form-text="input"
                                    data-type=${postalCodeHandler}
                                    type="text"
                                    autoComplete="postal-code"
                                    id="form-text-zipcode"
                                    placeholder=${placeHolderZipcode}
                                    pattern=${zipCodePattern}
                                    name="zipCode"
                                    readOnly=${!isCustomer}
                                    value=${userInfo.zipCode}
                                    onFocus=${onFocus}
                                    onBlur=${onError}
                                    onInvalid=${onError}
                                    onInput=${onInput}
                                    inputMode="numeric"
                                    onChange=${handleInputChange}
                                    required
                                  />
                                  <label htmlFor="form-text-zipcode">
                                    ${Granite.I18n.get(`${labelZipcode}`)}
                                    <span className="cmp-form-text--asterisk">*</span>
                                  </label>
                                  <p className="cmp-form-text__required-block">${Granite.I18n.get('This field is required')}</p>
                                  <p className="cmp-form-text__constraint-block">${Granite.I18n.get(constraintMessage)}</p>
                                </div>
                              </div>
                            </div>
                            <div className="row">
                              <div className="text col-md-6 aem-GridColumn aem-GridColumn--default--6">

                                <div
                                  className="cmp-form-text form-floating"
                                  data-cmp-required-message="(Required)"
                                >
                                  <input
                                    className="cmp-form-text__text form-control"
                                    data-cmp-hook-form-text="input"
                                    type="text"
                                    autoComplete="given-name"
                                    id="form-text-contactName"
                                    placeholder="First Name"
                                    name="firstName"
                                    readOnly=${!isCustomer}
                                    value=${userInfo.firstName}
                                    onBlur=${onError}
                                    onInvalid=${onError}
                                    onInput=${onInput}
                                    onChange=${handleInputChange}
                                    required
                                  />
                                  <label htmlFor="form-text-contactName">
                                    ${Granite.I18n.get('First Name')}
                                    <span className="cmp-form-text--asterisk">*</span>
                                  </label>
                                  <p className="cmp-form-text__required-block">${Granite.I18n.get('This field is required')}</p>
                                </div>
                              </div>
                              <div className="text col-md-6 aem-GridColumn aem-GridColumn--default--12">
                                <div
                                  className="cmp-form-text form-floating"
                                  data-cmp-required-message="(Required)"
                                >
                                  <input
                                    className="cmp-form-text__text form-control"
                                    data-cmp-hook-form-text="input"
                                    type="text"
                                    autoComplete="family-name"
                                    id="form-text-contactlastname"
                                    placeholder="Last Name"
                                    name="lastName"
                                    readOnly=${!isCustomer}
                                    value=${userInfo.lastName}
                                    onBlur=${onError}
                                    onInvalid=${onError}
                                    onInput=${onInput}
                                    onChange=${handleInputChange}
                                    required
                                  />
                                  <label htmlFor="form-text-contactlastname">
                                    ${Granite.I18n.get('Last Name')}
                                    <span className="cmp-form-text--asterisk">*</span>
                                  </label>
                                  <p className="cmp-form-text__required-block">${Granite.I18n.get('This field is required')}</p>
                                </div>
                              </div>
                            </div>
                            <div className="row">
                              <div className="text col-md-6 aem-GridColumn aem-GridColumn--default--6">
                                <div
                                  className="cmp-form-text form-floating"
                                  data-cmp-required-message="(Required)"
                                >
                                  <input
                                    ref=${telRef}
                                    className="cmp-form-text__text form-control"
                                    data-cmp-hook-form-text="input"
                                    type="tel"
                                    data-type='tel'
                                    autoComplete="tel"
                                    id="form-text-contactPhone"
                                    placeholder="(___) ___-____"
                                    name="phoneNumber"
                                    readOnly=${!isCustomer}
                                    value=${userInfo.phoneNumber}
                                    pattern=${phonePattern}
                                    onFocus=${onFocus}
                                    onBlur=${onError}
                                    onInvalid=${onError}
                                    onInput=${onInput}
                                    onChange=${handleInputChange}
                                    required
                                  />
                                  <label htmlFor="form-text-contactPhone">
                                    ${steps.isCustomer
    ? Granite.I18n.get('Phone Number')
    : Granite.I18n.get('Business Phone')}
                                    <span className="cmp-form-text--asterisk">*</span>
                                  </label>
                                  <p className="cmp-form-text__required-block">${Granite.I18n.get('This field is required')}</p>
                                  <p className="cmp-form-text__constraint-block">${Granite.I18n.get('Please enter a valid phone number (ex. (123) 456-7890)')}</p>
                                </div>
                              </div>
                              <div className="text col-md-6 aem-GridColumn aem-GridColumn--default--12">
                                <div
                                  className="cmp-form-text form-floating"
                                  data-cmp-required-message="(Required)"
                                >
                                  <input
                                    className="cmp-form-text__text form-control"
                                    data-cmp-hook-form-text="input"
                                    type="email"
                                    autoComplete="email"
                                    id="form-text-contactemail"
                                    placeholder="Email Address"
                                    name="emailAddress"
                                    data-type="email"
                                    pattern="^[\w\-\.]+@([\w-]+\.)+[\w-]{2,4}$"
                                    readOnly=${!isCustomer}
                                    value=${userInfo.emailAddress}
                                    onBlur=${onError}
                                    onInvalid=${onError}
                                    onInput=${onInput}
                                    onChange=${handleInputChange}
                                    required
                                  />
                                  <label htmlFor="form-text-contactemail">
                                    ${Granite.I18n.get('Email Address')}
                                    <span className="cmp-form-text--asterisk">*</span>
                                  </label>
                                  <p className="cmp-form-text__required-block">${Granite.I18n.get('This field is required')}</p>
                                  <p className="cmp-form-text__constraint-block">${Granite.I18n.get('Please enter a valid email that follows standard format (ex. name@shredit.com)')}</p>
                                </div>
                              </div>
                            </div>
                            ${!prepopulated && html`
                            <div>
                              <div className="row justify-content-end align-items-center">
                                <div className=${`col-auto ${!isCustomer && 'invisible'}`}>
                                </div>
                                <div className="col-auto">
                                  <div className="linkcalltoaction ss-buttonstyle-secondary-bluebutton mb-3">
                                    <button
                                      className=${`cmp-form-button btn btn-primary ${!isCustomer && 'invisible'}`}
                                      type="submit"
                                      id="piiSubmitButton"
                                    >
                                      ${Granite.I18n.get('Start')}
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <div className="cmp-text mb-3 pe-3">
                                <p className="cmp-text disclaimer">
                                  ${Granite.I18n.get("Disclaimer: This assessment is provided for illustrative purposes and is intended to demonstrate some of the many factors that contribute to the risk of information theft or information management non-compliance. The results from this assessment ('Low', 'Moderate', 'High') are directional only and provided for the purpose of education and illustration. There may be no actual risk.")}
                                </p>
                              </div>
                            </div>`
}
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
<!--              {/* showing question flow on the first screen for the #salesAccess users to fill out  */}-->
              ${!steps.isCustomer && html`
                <div className="row cmp-columnrow">
                  <div
                    className="col-12 cmp-columnrow__item"
                    data-cmp-hook-columnrow="item"
                  >
                    <form
                      autoComplete="on"
                      className="cmp-securityriskassessmenttool-form container"
                      onSubmit=${handleSubmit}
                    >
                      <div className="cmp-securityriskassessmenttool-form__container ">
                        <div className="row cmp-columnrow justify-content-around">
                          <div
                            className="mb-4 mt-4"
                            data-prepopulated=${prepopulated}
                          >
                            <div className="row">${renderInputs()}</div>
                          </div>
                        </div>
                        <div className="row cmp-columnrow align-items-end justify-content-end">
                          <div className="col-auto">
                            <div className="linkcalltoaction ss-buttonstyle-secondary-bluebutton">
                              ${!prepopulated && html`
                                <button
                                  className="cmp-form-button btn btn-primary"
                                  type="submit"
                                  disabled={!submitEnabled}
                                >
                                  ${Granite.I18n.get('View Results')}
                                </button>
                              `}
                             ${prepopulated && html`
                                <button
                                  className="cmp-form-button btn btn-primary"
                                  type="submit"
                                >
                                  ${Granite.I18n.get('View Results')}
                                </button>
                              `}
                            </div>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              `}
            </div>
          </div>
        `}
<!--        {/*-->
<!--          PAGE 2 - Question Flow Screen for Customers-->

<!--        */}-->
        ${!steps.showResult
          && !steps.spinner
          && !steps.showSplash
          && steps.isCustomer && html`
            <form
              autoComplete="on"
              className="cmp-securityriskassessmenttool-form container"
              onSubmit=${handleSubmit}
            >
              <div className="cmp-securityriskassessmenttool-form__container ">
                <div className="row cmp-columnrow justify-content-around">
                  <div className="mt-3">
                    <h2 className="cmp-title__text ss-font-color--primary">${Granite.I18n.get("Let's get started")}</h2>
                    <h4>${Granite.I18n.get('Your assessment recommendations are only moments away.')}</h4>
                  </div>
                  <div id="contentquestionFlow" className="cmp-securityriskassessmenttool-form__questionflow mb-4 mt-2">
                    <div className="row">
                      <div className="gradiant-top"></div>
                      ${renderInputs()}
                      <div className="gradiant-bottom"></div>
                    </div>
                  </div>
                  <div className="cmp-securityriskassessmenttool-form__buttons mb-0 ms-4 ps-0">
                    <div className="row cmp-columnrow align-items-end justify-content-end">
                      <div className="col-auto">
                        <div className="linkcalltoaction ss-buttonstyle-secondary-bluebutton">
                          <button
                            className="cmp-form-button btn btn-primary"
                            onClick=${() => onChangeForm({
    showSplash: true,
    showResult: false,
  })
}
                          >
                            ${Granite.I18n.get('Back')}
                          </button>
                        </div>
                      </div>
                      <div className="col-auto ">
                        <div className="linkcalltoaction ss-buttonstyle-secondary-bluebutton">
                          <button
                            className="cmp-form-button btn btn-primary"
                            type="submit"
                            disabled=${!submitEnabled}
                          >
                            ${Granite.I18n.get('View Results')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row cmp-columnrow justify-content-start d-sm-none d-md-flex footer-section">
                  <div className="col-3 mb-2">
                    <img
                      src=${contentImageB}
                      className="cmp-securityriskassessmenttool-form__image"
                    />
                  </div>
                  <div className="col-9 col-lg-9 px-lg-0 align-self-center">
                    <p className="cmp-text ss-font-color--primary msg-big-bottom">
                      <b>${Granite.I18n.get('For more than 30 years, Shred-it has helped protect what')}${' '}</b>
                      ${Granite.I18n.get("matters – the health and well-being of our clients' confidential information, trusted relationships, and brand reputation.")}
                    </p>
                  </div>
                </div>
              </div>
            </form>
          `}
<!--        {/*-->
<!--        LOADING SPINNER & RESULTS SCREENS-->
<!--        */}-->
        ${steps.spinner ? html`
          <div className="cmp-securityriskassessmenttool-spinner">
              <${CustomLoader}
              />
          </div>` : steps.showResult ? html`
          <div className="cmp-securityriskassessmenttool-results container mt-4">
            <div className="row">
              <div className="col-12 col-lg-3 order-2 order-lg-1 p-2">
                <div className="cmp-title">
                  <h4 className="cmp-title__text pe-3 ss-font-color--primary">
                    ${Granite.I18n.get('Shred-it Information Security Risk Assessment Review')}
                  </h4>
                </div>

                <div className="cmp-text mb-4 pe-3">
                  <p>
                    ${Granite.I18n.get(
    "The results from your Information Security Risk Assessment indicate there may be gaps in your organization's confidential information security program that should be addressed. There are several possible reasons why you might have received this rating. In many cases, it's due to missing or incomplete document management and disposal practices.",
  )}
                  </p>
                  <p>
                    ${Granite.I18n.get(
    "With more than 30 years of experience helping organizations navigate security risks and protect their information, we'll provide actionable recommendations to help your organization remain safe, secure, and compliant.",
  )}
                  </p>

                </div>
                <div className="cmp-text mb-3 pe-3">
                  <p className="ss-font-color--primary">
                    <strong className=" ss-font-color--black">
                      ${Granite.I18n.get('Assessment Date')}${': '}
                    </strong>
                    ${userInfo.date}
                  </p>
                </div>
                <div className="cmp-text mb-3 pe-3">
                  <p className="ss-font-color--primary">
                    <strong className=" ss-font-color--black">
                      ${Granite.I18n.get('Company Name')}${': '}
                    </strong>
                    ${userInfo.companyName}
                  </p>
                </div>
                <div className="cmp-text mb-3 pe-3">
                  <p className="ss-font-color--primary">
                    <strong className=" ss-font-color--black">
                      ${Granite.I18n.get('Conducted For')}${": "}
                    </strong>
                    ${userInfo.conductedFor || ''}
                    ${!userInfo.conductedFor
                      && `${userInfo.firstName || ''} ${userInfo.lastName || ''}`}
                  </p>
                </div>

                <${PDFLink}
                  userInfo=${userInfo}
                  generalScore=${generalScore}
                  recommendations=${recommendations}
                />
                <div className="col-auto">
                  <div className="linkcalltoaction ss-buttonstyle-secondary-bluebutton">
                    ${isCustomer && html`
                      <button
                        className="cmp-form-button btn btn-primary"
                        onClick=${() => onChangeForm({
    showSplash: false,
    showResult: false,
  })
}
                      >
                        ${Granite.I18n.get('Back')}
                      </button>
                    `}
                    ${!isCustomer && html`
                      <button
                        className="cmp-form-button btn btn-primary"
                        onClick=${() => onChangeForm({
    showSplash: true,
    showResult: false,
  })
}
                      >
                        ${Granite.I18n.get('Back')}
                      </button>
                    `}
                  </div>
                </div>
                <div className="cmp-text mb-3 pe-3">
                  <p className="cmp-text disclaimer">
                    ${Granite.I18n.get("Disclaimer: This assessment is provided for illustrative purposes and is intended to demonstrate some of the many factors that contribute to the risk of information theft or information management non-compliance. The results from this assessment ('Low', 'Moderate', 'High') are directional only and provided for the purpose of education and illustration. There may be no actual risk.")}
                  </p>
                </div>

              </div>
              <div className="cmp-securityriskassessmenttool-results-container col-12 col-lg-9 pt-0 order-1 order-lg-2">
                <div className="cmp-securityriskassessmenttool-results__content row col-12 px-2 ps-2">
                  <div className="col-12 px-1 mt-3">
                    <div className="cmp-title col-12 ">
                      <h4 className="cmp-title__text ss-font-color--primarycmp-title__text ss-font-color--primary" role="status">
                        ${Granite.I18n.get('Your Results')}
                      </h4>
                    </div>
                    <div>
                      ${renderResultsFromGeneralScore()}
                    </div>
                  </div>
                </div>

                <div className="cmp-securityriskassessmenttool-results__content row col-12 px-2 ps-2">
                  <div className="cmp-securityriskassessmenttool-results__content--recomendation col-8 px-1">
                    <div className="cmp-title mb-4">
                      <h4 className="cmp-title__text ss-font-color--primary mb-1">
                        ${Granite.I18n.get('Your Shred-it Service Recommendation')}
                      </h4>
                       <p>
                        ${Granite.I18n.get('Based on your responses, we recommend the following services and products.')}
                      </p>
                    </div>
                    <p className="cmp-title__text ss-font-color--primary">
                      <b>${Granite.I18n.get('Your Shred-it Service Recommendation')}${": "}</b><span className="ss-font-color--black">${recommendations.serviceRecommended}</span>
                    </p>
                    <p className="cmp-title__text ss-font-color--primary">
                      <b>${Granite.I18n.get('Your Custom Console Service Recommendation')}${": "}</b><span className="ss-font-color--black">${recommendations.consoleService}${" "}${Granite.I18n.get("Standard Containers")}</span>
                    </p>
                    <p className="cmp-title__text ss-font-color--primary">
                      <b>${Granite.I18n.get('Frequency Recommendation')}${": "}</b><span className="ss-font-color--black">${recommendations.frequency}</span>
                    </p>
<!--                    {/*<p className="cmp-title__text ss-font-color&#45;&#45;primary">-->
<!--                      <b>{Granite.I18n.get("Training Recommendation")}{": "}</b><span className="ss-font-color&#45;&#45;black">{recommendations.training}</span>-->
<!--                    </p>*/}-->

                  </div>
                  <div className="col-4">
                    <img src=${securityRiskCan} />
                  </div>
                </div>
                <div className="row">
                  <div className="col-12">
                    <div className="cmp-securityriskassessmenttool-cta cmp-modal-form-cta__wrapper--desktop mt-4 mb-4 p-4">
                      <p className="text-center mb-0">
                         ${Granite.I18n.get('One of our local representatives will reach out to you shortly with ways you can quickly and easily secure your organization; protecting your people, your customers, and your business.')}
                      </p>
                    </div>
                    <div className="cmp-title">
                      <h4 className="cmp-title__text ss-font-color--primary">
                        ${Granite.I18n.get('What does a Regularly Scheduled Paper Shredding Service Include?')}
                      </h4>
                    </div>
                  </div>
                  <div className=" col-md-4 text ss-vertical-space--bottom-x3 ss-list-style--orange-triangles ss-list-style--more-space aem-GridColumn aem-GridColumn--default--12">
                    <div className="cmp-text">
                      <ul>
                        <li>${Granite.I18n.get('CSR Credentials')}</li>
                        <li>${Granite.I18n.get('Employee Training Resources')}</li>
                        <li>${Granite.I18n.get('Complementary Workplace Privacy Policies')}</li>
                      </ul>
                    </div>
                  </div>
                  <div className=" col-md-4 text ss-vertical-space--bottom-x3 ss-list-style--orange-triangles ss-list-style--more-space aem-GridColumn aem-GridColumn--default--12">
                    <div className="cmp-text">
                      <ul>
                        <li>${Granite.I18n.get('Certification of Destruction')}</li>
                        <li>${Granite.I18n.get('Shred-it Secure Chain of Custody')}</li>
                        <li>${Granite.I18n.get('Secure Locked Containers')}</li>
                      </ul>
                    </div>
                  </div>
                  <div className=" col-md-4 text ss-vertical-space--bottom-x3 ss-list-style--orange-triangles ss-list-style--more-space aem-GridColumn aem-GridColumn--default--12">
                    <div className="cmp-text">
                      <ul>
                        <li>${Granite.I18n.get('My Shred-it Customer Portal')}</li>
                        <li>${Granite.I18n.get('On-site or Off-site Service Options')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ` : html``}
      </div>
    </div>
  `;
};

const loadQuestions = async () => {
  try {
    const response = await fetch('/blocks/security-risk-assessment-tool/questions.json');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading questions:', error);
    return [];
  }
};

export const initSecurityRiskAssessment = async () => {
  try {
    const isCustomer = !(window.location?.hash?.indexOf('salesAccess') > 0);
    const mainContainer = document.querySelector('#securityRiskAssessmentTool');
    let isCa = false;
    if (mainContainer && mainContainer.hasAttribute('data-version') && mainContainer.dataset.version == 'true') {
      isCa = true;
    }

    const customerInfo = {
      date: undefined,
      companyName: undefined,
      conductedFor: undefined,
      firstName: undefined,
      lastName: undefined,
      companyName: undefined,
      emailAddress: undefined,
      phoneNumber: undefined,
      zipCode: undefined,
    };
    const listQuestions = await loadQuestions();
    let questionList = listQuestions;
    let prepopulated = false;
    let generalScore = 0;
    // Reduce the list of questions into a map
    const mapQuestions = listQuestions.reduce((mapAccumulator, obj) => {
      mapAccumulator.set(`ct_${obj.order}`, obj);
      return mapAccumulator;
    }, new Map());
    // if the user is NOT a customer, we need to check the query string for values to prepopulate the form with
    if (!isCustomer) {
      const query = window.location.search.substring(1);
      const params = new URLSearchParams(query);
      // loop through all query parameters
      for (const param of params.entries()) {
        // if query parameter contains ct_, we're populating the user selection value of the question obejct
        if (param[0].includes('ct_')) {
          // if the key of the questionMap matches the query parameter
          if (mapQuestions.has(param[0])) {
            // grab the question object from the map
            const question = mapQuestions.get(param[0]);
            // if the value of the queryParameter is a valid selection for the question
            if (question.inputType === 'number') {
              question.userSelection = param[1];
              question.visible = true;
              mapQuestions.set(param[0], question);
            } else if (question.options.includes(param[1])) {
              if (param[1] === 'Yes' || param[1] === 'Shredding Provider') {
                generalScore += question.score;
              }
              question.userSelection = param[1];
              question.visible = true;
              mapQuestions.set(param[0], question);
            }
          }
          if (!prepopulated) prepopulated = true;
        }
        if (param[0] in customerInfo) {
          customerInfo[param[0]] = param[1];
        }
      }
      // set questionList to contain the prepopulated user values
      questionList = Array.from(mapQuestions, ([name, value]) => value);
    }
    const srat = document.querySelector('#securityRiskAssessmentTool');
    if (srat) {
      ReactDOM.render(
        html`
            <${SecurityRiskAssessmentTool}
                    ...${{
    mapQuestions: questionList,
    customerInfo,
    prepopulated,
    isCustomer,
    isCa,
    generalScorePreloaded: generalScore,
  }}/>`,
        srat,
      );
    }
  } catch (e) {
    console.log(e);
  }
};

window.Granite = {};
window.Granite.I18n = {};
window.Granite.I18n.get = (x) => x;
// prepop test url
// http://localhost:8080/?ct_1=No&ct_2=Pharmacy&ct_3=Other&ct_4=Yes&ct_5=No&ct_6=No&ct_7=Yes&ct_8=No&ct_9=Yes&ct_10=No&ct_11=No&ct_12=Yes&ct_13=No&ct_14=No&ct_15=No&ct_16=Yes&ct_17=No&ct_18=Yes&ct_19=No&firstName=Tom&lastName=Scott&companyName=Avionos%20Test&emailAddress=tom.scott@avionos.com&phoneNumber=(206)%20555-5555&zipCode=98059&date=11-03-2021#salesAccess
