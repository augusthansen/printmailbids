import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | PrintMailBids',
  description: 'Privacy Policy for PrintMailBids marketplace',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Privacy Policy</h1>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 prose prose-slate max-w-none">
          <p className="text-stone-600 mb-2">
            <strong>Effective Date:</strong> January 1, 2025
          </p>
          <p className="text-stone-600 mb-6">
            <strong>Last Updated:</strong> January 1, 2025
          </p>

          <p className="text-stone-600 mb-6">
            PrintMailBids.com (&quot;we,&quot; &quot;us,&quot; &quot;our,&quot; or the &quot;Platform&quot;), operated by Megabox Supply LLC, is committed to protecting the privacy and security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at https://www.PrintMailBids.com (the &quot;Website&quot;) or use our services. Please read this Privacy Policy carefully. By accessing or using the Platform, you acknowledge that you have read, understood, and agree to be bound by the terms of this Privacy Policy. If you do not agree with the terms of this Privacy Policy, please do not access the Website or use our services.
          </p>

          {/* Section 1 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">1. Information We Collect</h2>
          <p className="text-stone-600 mb-4">
            We collect information about you in various ways when you use our Platform. The types of information we may collect include:
          </p>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">1.1 Information You Provide Directly</h3>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-3">
            <li><strong>(a) Account Registration Information:</strong> When you create an account, we collect your name, email address, password, phone number, and mailing address.</li>
            <li><strong>(b) Business Information:</strong> If registering as a business, we may collect your company name, business address, tax identification number, and authorized representative information.</li>
            <li><strong>(c) Identity Verification:</strong> We may request a copy of a valid government-issued photo identification, proof of business registration, or other documentation to verify your identity and prevent fraud.</li>
            <li><strong>(d) Payment Information:</strong> When you make purchases or receive payments, we collect payment card numbers, bank account information, billing addresses, and related financial data. Payment processing is handled by third-party payment processors, and we may store only partial payment information (such as the last four digits of your card) for reference purposes.</li>
            <li><strong>(e) Listing and Auction Information:</strong> When you create listings or participate in auctions, we collect descriptions, photographs, specifications, pricing information, and other content you provide.</li>
            <li><strong>(f) Communications:</strong> We collect information contained in your communications with us, including customer support requests, feedback, and messages exchanged with other users through our Platform.</li>
          </ul>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">1.2 Information Collected Automatically</h3>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-3">
            <li><strong>(a) Device and Browser Information:</strong> We automatically collect information about your device, including IP address, browser type and version, operating system, device identifiers, and hardware model.</li>
            <li><strong>(b) Usage Data:</strong> We collect information about your interactions with the Platform, including pages viewed, links clicked, search queries, bidding activity, items viewed, time spent on pages, and referring URLs.</li>
            <li><strong>(c) Location Information:</strong> We may collect approximate location information based on your IP address. With your consent, we may collect more precise location data from your mobile device.</li>
            <li><strong>(d) Transaction Records:</strong> We maintain records of your bids, purchases, sales, and other transactions conducted through the Platform.</li>
          </ul>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">1.3 Information from Third Parties</h3>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-3">
            <li><strong>(a) Identity Verification Services:</strong> We may receive information from third-party identity verification services to help prevent fraud and verify your identity.</li>
            <li><strong>(b) Payment Processors:</strong> We receive transaction confirmation and limited account information from our payment processing partners.</li>
            <li><strong>(c) Public Sources:</strong> We may collect publicly available business information to verify seller credentials or enhance our services.</li>
          </ul>

          {/* Section 2 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="text-stone-600 mb-4">We use the information we collect for the following purposes:</p>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-3">
            <li><strong>(a) Providing and Improving Services:</strong> To operate, maintain, and improve the Platform; process transactions; facilitate communications between buyers and sellers; and develop new features and services.</li>
            <li><strong>(b) Account Management:</strong> To create and manage your account, verify your identity, and authenticate your access to the Platform.</li>
            <li><strong>(c) Transaction Processing:</strong> To process bids, purchases, payments, and other transactions; generate invoices; and maintain transaction records.</li>
            <li><strong>(d) Communications:</strong> To send you transactional messages (such as bid confirmations, auction results, and payment receipts), respond to your inquiries, and provide customer support.</li>
            <li><strong>(e) Marketing and Promotions:</strong> To send you promotional communications about new listings, auctions, features, and services that may interest you. You may opt out of marketing communications at any time.</li>
            <li><strong>(f) Personalization:</strong> To personalize your experience on the Platform, including recommending listings and content based on your interests and activity.</li>
            <li><strong>(g) Security and Fraud Prevention:</strong> To protect the security and integrity of the Platform; detect, prevent, and investigate fraud, unauthorized access, and other illegal activities; and enforce our Terms and Conditions.</li>
            <li><strong>(h) Analytics and Research:</strong> To analyze usage patterns, measure the effectiveness of our services, conduct research, and generate aggregate statistics about our user base.</li>
            <li><strong>(i) Legal Compliance:</strong> To comply with applicable laws, regulations, legal processes, and government requests.</li>
            <li><strong>(j) Business Operations:</strong> To facilitate business transfers, mergers, acquisitions, or other corporate transactions involving PrintMailBids.com or Megabox Supply LLC.</li>
          </ul>

          {/* Section 3 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">3. Disclosure of Information to Sellers</h2>
          <p className="text-stone-600 mb-4">
            Sellers on PrintMailBids.com operate as independent third parties. To facilitate transactions and enable sellers to screen and approve bidders, we share certain information with sellers:
          </p>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-2">
            <li>(a) Your name, email address, phone number, and shipping address when you place a bid or make a purchase.</li>
            <li>(b) Your bidding history and transaction history with that seller.</li>
            <li>(c) Any communications you send through the Platform regarding their listings.</li>
          </ul>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-6">
            <p className="text-amber-800 text-sm font-medium mb-0">
              <strong>IMPORTANT:</strong> By using the Platform, you authorize and direct PrintMailBids.com to disclose your personal information to sellers as necessary to facilitate transactions. While we require sellers to maintain appropriate privacy practices, we do not control how sellers use your information once disclosed. Each seller may have their own privacy policy governing their use of your data. PrintMailBids.com is not responsible for the privacy practices of sellers, and you agree to release us from any liability arising from a seller&apos;s use or misuse of your personal information.
            </p>
          </div>

          {/* Section 4 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">4. Other Disclosures of Your Information</h2>
          <p className="text-stone-600 mb-4">In addition to sharing information with sellers, we may disclose your information to third parties in the following circumstances:</p>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-3">
            <li><strong>(a) Service Providers:</strong> We share information with third-party vendors, consultants, and service providers who perform services on our behalf, such as payment processing, data analytics, email delivery, hosting, customer service, and marketing. These service providers are contractually obligated to use your information only for the purposes of providing services to us.</li>
            <li><strong>(b) Legal Requirements:</strong> We may disclose your information when required by law, such as in response to a subpoena, court order, government investigation, or other legal process. We may also disclose information when we believe in good faith that disclosure is necessary to protect our rights, protect your safety or the safety of others, investigate fraud, or respond to a government request.</li>
            <li><strong>(c) Business Transfers:</strong> In the event of a merger, acquisition, reorganization, bankruptcy, or sale of all or a portion of our assets, your information may be transferred as part of that transaction. We will notify you via email or prominent notice on our Website of any change in ownership or uses of your personal information.</li>
            <li><strong>(d) Dispute Resolution:</strong> We may share information between buyers and sellers, or with third-party dispute resolution services, to help resolve disputes arising from transactions on the Platform.</li>
            <li><strong>(e) Protection of Rights:</strong> We may disclose information to enforce our Terms and Conditions, protect our operations, protect the rights, privacy, safety, or property of PrintMailBids.com, our users, or others, and to pursue available legal remedies.</li>
            <li><strong>(f) With Your Consent:</strong> We may share your information with third parties when you have given us explicit consent to do so.</li>
          </ul>

          {/* Section 5 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">5. Cookies and Tracking Technologies</h2>
          <p className="text-stone-600 mb-4">
            We use cookies, web beacons, pixels, and similar tracking technologies to collect information about your browsing activities and to improve your experience on the Platform.
          </p>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">5.1 Types of Cookies We Use</h3>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-3">
            <li><strong>(i) Essential Cookies:</strong> These cookies are necessary for the Website to function properly and cannot be disabled. They enable core functionality such as security, account authentication, and remembering your preferences.</li>
            <li><strong>(ii) Performance Cookies:</strong> These cookies collect information about how you use the Website, such as which pages you visit most often. This data helps us improve the performance and design of the Platform.</li>
            <li><strong>(iii) Functional Cookies:</strong> These cookies allow the Website to remember choices you make and provide enhanced, personalized features, such as keeping track of items you are bidding on.</li>
            <li><strong>(iv) Advertising Cookies:</strong> These cookies are used to deliver advertisements relevant to you and your interests. They also help measure the effectiveness of advertising campaigns.</li>
          </ul>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">5.2 Managing Cookies</h3>
          <p className="text-stone-600 mb-4">
            You can control and manage cookies through your browser settings. Most browsers allow you to refuse cookies or alert you when cookies are being sent. However, if you disable cookies, some features of the Website may not function properly. For more information about cookies and how to manage them, visit <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.allaboutcookies.org</a>.
          </p>

          {/* Section 6 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">6. Data Security</h2>
          <p className="text-stone-600 mb-4">
            We implement reasonable administrative, technical, and physical security measures designed to protect your personal information from unauthorized access, use, alteration, and disclosure. These measures include:
          </p>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-2">
            <li>(a) Encryption of sensitive data in transit using SSL/TLS protocols.</li>
            <li>(b) Secure storage of passwords using industry-standard hashing algorithms.</li>
            <li>(c) Regular security assessments and vulnerability testing.</li>
            <li>(d) Access controls limiting employee access to personal information on a need-to-know basis.</li>
            <li>(e) Secure data centers with physical access controls.</li>
          </ul>
          <div className="bg-stone-100 border border-stone-300 rounded-lg p-4 my-4">
            <p className="text-stone-700 text-sm mb-0">
              <strong>DISCLAIMER:</strong> Despite our efforts, no method of transmission over the Internet or method of electronic storage is completely secure. We cannot guarantee the absolute security of your information. You acknowledge that you provide your personal information at your own risk and are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </div>

          {/* Section 7 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">7. Data Retention</h2>
          <p className="text-stone-600 mb-4">
            We retain your personal information for as long as necessary to fulfill the purposes for which it was collected and to comply with our legal obligations:
          </p>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-3">
            <li><strong>(a) Account Information:</strong> We retain your account information for as long as your account is active and for a reasonable period thereafter to allow you to reactivate your account or to comply with legal requirements.</li>
            <li><strong>(b) Transaction Records:</strong> We retain records of transactions for at least seven (7) years to comply with tax, accounting, and legal obligations.</li>
            <li><strong>(c) Communications:</strong> We may retain communications and support records for quality assurance and dispute resolution purposes.</li>
            <li><strong>(d) Legal Requirements:</strong> We may retain certain information for longer periods as required by law or to establish, exercise, or defend legal claims.</li>
          </ul>

          {/* Section 8 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">8. Your Rights and Choices</h2>
          <p className="text-stone-600 mb-4">Depending on your location, you may have certain rights regarding your personal information:</p>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">8.1 Account Access and Updates</h3>
          <p className="text-stone-600 mb-4">
            You may access, review, and update your account information at any time by logging into your account and visiting the &quot;My Account&quot; or &quot;Account Settings&quot; section of the Website. You are responsible for maintaining the accuracy of your information.
          </p>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">8.2 Email Communications</h3>
          <p className="text-stone-600 mb-4">
            You may opt out of receiving promotional emails by clicking the &quot;unsubscribe&quot; link at the bottom of any marketing email we send. Please note that even if you opt out of marketing communications, we may still send you transactional messages related to your account and transactions.
          </p>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">8.3 Data Subject Rights</h3>
          <p className="text-stone-600 mb-2">Subject to applicable law, you may have the right to:</p>
          <ul className="list-disc pl-6 text-stone-600 mb-4 space-y-2">
            <li>(i) Request access to the personal information we hold about you.</li>
            <li>(ii) Request correction of inaccurate or incomplete personal information.</li>
            <li>(iii) Request deletion of your personal information, subject to certain exceptions.</li>
            <li>(iv) Request restriction of processing of your personal information.</li>
            <li>(v) Object to processing of your personal information.</li>
            <li>(vi) Request portability of your personal information.</li>
          </ul>

          {/* Section 9 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">9. California Privacy Rights</h2>
          <p className="text-stone-600 mb-4">
            If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA):
          </p>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">9.1 Right to Know</h3>
          <p className="text-stone-600 mb-4">
            You have the right to request that we disclose the categories and specific pieces of personal information we have collected about you, the categories of sources from which the information was collected, the business purpose for collecting the information, and the categories of third parties with whom we share the information.
          </p>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">9.2 Right to Delete</h3>
          <p className="text-stone-600 mb-4">
            You have the right to request deletion of your personal information, subject to certain exceptions (such as when retention is necessary to complete a transaction, detect security incidents, comply with legal obligations, or for certain internal uses).
          </p>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">9.3 Right to Correct</h3>
          <p className="text-stone-600 mb-4">
            You have the right to request that we correct inaccurate personal information that we maintain about you.
          </p>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">9.4 Right to Opt Out of Sale/Sharing</h3>
          <p className="text-stone-600 mb-4">
            PrintMailBids.com does not sell your personal information in the traditional sense. However, certain sharing of information for targeted advertising purposes may constitute a &quot;sale&quot; or &quot;sharing&quot; under California law. You have the right to opt out of such practices.
          </p>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">9.5 Non-Discrimination</h3>
          <p className="text-stone-600 mb-4">
            We will not discriminate against you for exercising your privacy rights. However, some features of the Platform may not function properly if you choose to delete certain information.
          </p>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">9.6 Exercising Your Rights</h3>
          <p className="text-stone-600 mb-4">
            To exercise your California privacy rights, please contact us at <a href="mailto:privacy@printmailbids.com" className="text-blue-600 hover:underline">privacy@printmailbids.com</a> or call us at (877) 450-7756. We may need to verify your identity before processing your request. You may designate an authorized agent to submit requests on your behalf by providing written authorization.
          </p>

          {/* Section 10 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">10. Do Not Track Signals</h2>
          <p className="text-stone-600 mb-4">
            Some web browsers have a &quot;Do Not Track&quot; feature that signals to websites that you do not want your online activity tracked. Our Website does not currently respond to &quot;Do Not Track&quot; signals. However, you can manage your cookie preferences as described in Section 5 above.
          </p>

          {/* Section 11 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">11. Third-Party Websites and Services</h2>
          <p className="text-stone-600 mb-4">
            The Platform may contain links to third-party websites, services, or applications that are not operated by us. This Privacy Policy does not apply to third-party sites. We are not responsible for the privacy practices of third parties. We encourage you to review the privacy policies of any third-party sites you visit.
          </p>

          {/* Section 12 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">12. Children&apos;s Privacy</h2>
          <p className="text-stone-600 mb-4">
            The Platform is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that we have collected personal information from a child under 18 without verification of parental consent, we will take steps to delete that information. If you believe we may have collected information from a child under 18, please contact us immediately at <a href="mailto:privacy@printmailbids.com" className="text-blue-600 hover:underline">privacy@printmailbids.com</a>.
          </p>

          {/* Section 13 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">13. International Users</h2>
          <p className="text-stone-600 mb-4">
            PrintMailBids.com is operated from the United States. If you access the Platform from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States, where data protection laws may differ from those in your country. By using the Platform, you consent to the transfer of your information to the United States and the processing of your information in accordance with this Privacy Policy.
          </p>

          {/* Section 14 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">14. Changes to This Privacy Policy</h2>
          <p className="text-stone-600 mb-4">
            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will notify you by posting the updated Privacy Policy on this page with a new &quot;Last Updated&quot; date. We may also notify you by email or through a notice on the Website. Your continued use of the Platform after any changes to this Privacy Policy constitutes your acceptance of the updated policy. We encourage you to review this Privacy Policy periodically.
          </p>

          {/* Section 15 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">15. Contact Us</h2>
          <p className="text-stone-600 mb-4">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at:
          </p>
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-6">
            <p className="text-stone-700 font-medium mb-2">PrintMailBids.com</p>
            <p className="text-stone-600 text-sm mb-2">Operated by Megabox Supply LLC</p>
            <ul className="text-stone-600 space-y-1">
              <li>Email: <a href="mailto:privacy@printmailbids.com" className="text-blue-600 hover:underline">privacy@printmailbids.com</a></li>
              <li>Phone: (877) 450-7756</li>
              <li>General Inquiries: <a href="mailto:support@printmailbids.com" className="text-blue-600 hover:underline">support@printmailbids.com</a></li>
            </ul>
          </div>

          {/* Section 16 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">16. Terms and Conditions</h2>
          <p className="text-stone-600 mb-4">
            This Privacy Policy is incorporated into and subject to our Terms and Conditions. Please review our <a href="/terms" className="text-blue-600 hover:underline">Terms and Conditions</a> for additional information about your rights and obligations when using the Platform.
          </p>

          {/* Section 17 */}
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">17. Your Consent</h2>
          <p className="text-stone-600 mb-4">
            By using PrintMailBids.com, you signify your acceptance of this Privacy Policy. If you do not agree to this Privacy Policy, please do not use our Website or services.
          </p>

          <div className="mt-8 pt-6 border-t border-stone-200">
            <div className="bg-slate-900 text-white rounded-lg p-4">
              <p className="text-sm font-medium text-center mb-0">
                BY USING PRINTMAILBIDS.COM, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THIS PRIVACY POLICY.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
