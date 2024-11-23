import React from 'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm';

import {
  PDFDownloadLink,
  Document,
  Page,
  Image,
  View,
  Text,
  StyleSheet,
} from 'https://cdn.jsdelivr.net/npm/@react-pdf/renderer@3.1.14/+esm';
import htm from 'https://esm.sh/htm';
import pdfStyles from './styles/pdfStyles.js';

const html = htm.bind(React.createElement);
const styles = StyleSheet.create(pdfStyles);
const heroBanner = '../../icons/securityrisk-Hero-Banner.png';
const securityRiskCan = '../../icons/securityrisk-can.png';
const arrow = '../../icons/securityrisk-arrow.png';

const MyDoc = ({ userInfo, generalScore, recommendations }) => {
  const riskLevelColor = () => {
    if (generalScore <= 100) {
      return '#DD1C1A';
    } if (generalScore > 100 && generalScore <= 160) {
      return '#ffba3c';
    } if (generalScore > 160) {
      return '#00857A';
    }
  };

  const riskLevel = (color) => {
    if (color == '#DD1C1A') return 'High';
    if (color == '#ffba3c') return 'Moderate';
    if (color == '#00857A') return 'Low';
  };

  const riskLevelText = (color) => {
    if (color == '#DD1C1A') return 'There are gaps in your organization’s confidential information security that should be addressed. It’s important to take measures as soon as possible to reduce your risk and protect your organization’s confidential information from getting into the wrong hands.';
    if (color == '#ffba3c') return 'While your organization’s confidential information security is strong in some areas, you appear to have a medium risk for an information breach which means there are weaknesses. It’s important to take measures as soon as possible to secure your confidential information and protect one of your most important assets: your information.';
    if (color == '#00857A') return 'You seem to have a good handle on your organization’s confidential information and appear to have a low risk for an information breach. However, you should still be vigilant when it comes to protecting your information security and there are a few things you should do to further secure your confidential information and protect your organization from risk in the future.';
  };

  return html`
    <${Document} size="A4" orientation>
      <${Page} size="A4" style=${styles.page} orientation="landscape">
        <${View} style=${styles.pageContainer}>
          <${Image} style=${styles.hero} src=${heroBanner} />
          <${View} style=${styles.leftContainer}>
            <${Text} style=${styles.title}>
              ${Granite.I18n.get('Shred-it Information Security Risk Assessment Review')}
            </${Text}>
            <${Text} style=${styles.text}>
              ${
  Granite.I18n.get(
    'The results from your Information Security Risk Assessment indicate there may be gaps in your organization’s confidential information security program that should be addressed. There are several possible reasons why you might have received this rating. In many cases, it’s due to missing or incomplete document management and disposal practices.',
  )
}
            </${Text}>
            <${Text} style=${styles.text}>${'\u00A0'}</${Text}>
            <${Text} style=${styles.text}>
              ${
  Granite.I18n.get(
    'With more than 30 years of experience helping organizations navigate security risks and protect their information, we’ll provide actionable recommendations to help your organization remain safe, secure, and compliant.',
  )
}
            </${Text}>
            <${Text} style=${styles.text}> ${'\n\n'}</${Text}>
            <${Text} style=${[styles.text, { color: '#000000', fontWeight: 'bold' }]}>
              ${Granite.I18n.get('Assessment Date')}${': '}<${Text} style=${[{ color: '#006CB4' }]}>${userInfo.date}</${Text}>
            </${Text}>
            <${Text} style=${[styles.text, { color: '#000000', fontWeight: 'bold' }]}>
              ${Granite.I18n.get('Company Name')}${': '}<${Text} style=${[{ color: '#006CB4' }]}>${userInfo.companyName}</${Text}>
            </${Text}>
            <${Text} style=${[styles.text, { color: '#000000', fontWeight: 'bold' }]}>
              ${Granite.I18n.get('Conducted For')}${': '}<${Text} style=${[{ color: '#006CB4' }]}>${userInfo.firstName}${' '}${userInfo.lastName}</${Text}>
            </${Text}>
            <${Text} style=${styles.text}>${'\u00A0'}</${Text}>
            <${Text} style=${styles.textDisclaimer}>
              ${Granite.I18n.get('Disclaimer: This assessment is provided for illustrative purposes and is intended to demonstrate some of the many factors that contribute to the risk of information theft or information management non-compliance. The results from this assessment (“Low,” “Moderate,” “High”) are directional only and provided for the purpose of education and illustration. There may be no actual risk')}
            </${Text}>
          </${View}>
          <${View} style=${styles.rightContainer}>
            <${View} style=${styles.results}>
              <${View} key="GeneralScore">
                <${Text} style=${styles.title}>
                  ${Granite.I18n.get('Your Results')}
                </${Text}>
                <${View} style=${[styles.generalScore, { borderColor: `${riskLevelColor()}` }]}>
                  <${Text} style=${[styles.title, { color: `${riskLevelColor()}`, fontSize: '12', lineHeight: '1.2' }]}>
                    ${Granite.I18n.get(`${riskLevel(riskLevelColor())} risk for Security Data Breach`)}
                    ${'\n\n'}
                    <${Text} style=${styles.text}>
                      ${Granite.I18n.get(riskLevelText(riskLevelColor()))}
                    </${Text}>
                  </${Text}>
                </${View}>
              </${View}>
              <${View} key="Recomendations" style=${[styles.row, styles.rowSpacer]}>
                <${View} style=${[styles.col]}>
                  <${Text} style=${styles.title}>
                    ${Granite.I18n.get('Your Shred-it Service Recommendation')}
                  </${Text}>
                  <${Text} style=${styles.text}>
                    ${Granite.I18n.get('Based on your responses, we recommend the following services and products.')}
                  </${Text}>
                  <${Text} style=${styles.text}>${'\n'}</${Text}>
                  <${Text} style=${[styles.text, styles.itemText]}>
                    ${Granite.I18n.get('Your Shred-it Service Recommendation')}${': '}<${Text} style=${[{ color: '#000000', fontSize: 10 }]}>${recommendations.serviceRecommended}</${Text}>
                  </${Text}>
                  <${Text} style=${[styles.text, styles.itemText]}>
                    ${Granite.I18n.get('Your Custom Console Service Recommendation')}${': '}<${Text} style=${[{ color: '#000000', fontSize: 10 }]}>${recommendations.consoleService} ${Granite.I18n.get('Standard Containers')}</${Text}>
                  </${Text}>
                  <${Text} style=${[styles.text, styles.itemText]}>
                    ${Granite.I18n.get('Frequency Recommendation')}${': '}<${Text} style=${[{ color: '#000000', fontSize: 10 }]}>${recommendations.frequency}</${Text}>
                  </${Text}>
                </${View}>
                <${View} style=${[styles.col]}>
                  <${Image} style=${styles.can} src=${securityRiskCan} />
                </${View}>
              </${View}>
              <${View} style=${styles.ctaSection}>
                <${Text} style=${[{ color: '#007f9a', fontSize: '10', lineHeight: '1.2', textAlign: 'center' }]}>
                  ${Granite.I18n.get('One of our local representatives will reach out to you shortly with ways you can quickly and easily secure your organization; protecting your people, your customers, and your business.')}
                </${Text}>
              </${View}>
              <${Text} style=${styles.text}>${'\n'}</${Text}>
              <${Text} style=${styles.title}>
                ${Granite.I18n.get('What does a Regularly Scheduled Paper Shredding Service Include?')}
              </${Text}>
              <${View} style=${[styles.row, styles.rowSpacer]}>
                <${View} style=${[styles.col]}>
                  <${Text} style=${[styles.text, styles.textList]}><${Image} src=${arrow} style=${styles.arrow} /> ${Granite.I18n.get('CSR Credentials')}</${Text}>
                  <${Text} style=${[styles.text, styles.textList]}><${Image} src=${arrow} style=${styles.arrow} /> ${Granite.I18n.get('Employee Training Resources')}</${Text}>
                  <${Text} style=${[styles.text, styles.textList]}><${Image} src=${arrow} style=${styles.arrow} /> ${Granite.I18n.get('Complementary Workplace \n')}</${Text}>
                  <${Text} style=${[styles.text, styles.textList, { paddingLeft: '17' }]}> ${Granite.I18n.get('Privacy Policies')}</${Text}>
                </${View}>
                <${View} style=${[styles.col]}>
                  <${Text} style=${[styles.text, styles.textList]}><${Image} src=${arrow} style=${styles.arrow} /> ${Granite.I18n.get('Certification of Destruction')}</${Text}>
                  <${Text} style=${[styles.text, styles.textList]}><${Image} src=${arrow} style=${styles.arrow} /> ${Granite.I18n.get('Shred-it Secure Chain of \n')}</${Text}>
                  <${Text} style=${[styles.text, styles.textList, { paddingLeft: '17' }]}> ${Granite.I18n.get('Custody')}</${Text}>
                  <${Text} style=${[styles.text, styles.textList]}><${Image} src=${arrow} style=${styles.arrow} /> ${Granite.I18n.get('Secure Locked Containers')}</${Text}>
                </${View}>
                <${View} style=${[styles.col]}>
                  <${Text} style=${[styles.text, styles.textList]}><${Image} src=${arrow} style=${styles.arrow} /> ${Granite.I18n.get('My Shred-it Customer Portal')}</${Text}>
                  <${Text} style=${[styles.text, styles.textList]}><${Image} src=${arrow} style=${styles.arrow} /> ${Granite.I18n.get('On-site or Off-site \n')}</${Text}>
                  <${Text} style=${[styles.text, styles.textList, { paddingLeft: '17' }]}> ${Granite.I18n.get('Service Options')}</${Text}>
                </${View}>
              </${View}>
            </${View}>
          </${View}>
        </${View}>
      </${Page}>
    </${Document}>
  `;
};
const fileName = 'SecurityRiskAssessment.pdf';
const PDFLink = ({ userInfo, generalScore, recommendations }) => html`
  <div>
    <${PDFDownloadLink}
      document=${html`
        <${MyDoc}
          userInfo=${userInfo}
          generalScore=${generalScore}
          recommendations=${recommendations}
        />
      `}
      fileName="SecurityRiskAssessment.pdf"
    >
      ${({ blob, url, loading, error }) => (loading
    ? 'Loading document...'
    : html`
              <div className="linkcalltoaction ss-buttonstyle-secondary-bluebutton">
                <span className="cmp-form-button btn btn-primary">
                  ${Granite.I18n.get('Download Assessment Results')}
                </span>
              </div>
            `)}
    </${PDFDownloadLink}>
  </div>
`;

export default PDFLink;
