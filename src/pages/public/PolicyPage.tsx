import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Cookie, FileText, Shield, Users } from "lucide-react";
import "./PolicyPage.css";

type TabId = "terms" | "privacy" | "cookies" | "conduct" | "bookings";

const TAB_ORDER: TabId[] = ["terms", "privacy", "cookies", "conduct", "bookings"];

const TAB_META: Record<TabId, { label: string; blurb: string; icon: React.ReactNode }> = {
  terms: {
    label: "Terms of Service",
    blurb: "Using the portal, accounts, and acceptable use.",
    icon: <FileText size={22} strokeWidth={1.75} />,
  },
  privacy: {
    label: "Privacy Policy",
    blurb: "What we collect, why, and how long we keep it.",
    icon: <Shield size={22} strokeWidth={1.75} />,
  },
  cookies: {
    label: "Cookie Policy",
    blurb: "Sessions, browser storage, and optional analytics.",
    icon: <Cookie size={22} strokeWidth={1.75} />,
  },
  conduct: {
    label: "Community Guidelines",
    blurb: "Expectations for mentors, mentees, and reviews.",
    icon: <Users size={22} strokeWidth={1.75} />,
  },
  bookings: {
    label: "Booking & cancellation",
    blurb: "Requests, confirmations, cancellations, and meetings.",
    icon: <BookOpen size={22} strokeWidth={1.75} />,
  },
};

function isTabId(value: string | null): value is TabId {
  return value !== null && TAB_ORDER.includes(value as TabId);
}

const PolicyPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const activeTab: TabId = isTabId(tabFromUrl) ? tabFromUrl : "terms";

  const selectTab = (id: TabId) => {
    setSearchParams({ tab: id }, { replace: true });
  };

  return (
    <div className="policy-page mb-policies-surface mb-legal-safe-x">
      <div className="policy-shell mb-policies-shell animate-fade-in">
        <header className="policy-header mb-policies-hero">
          <Link to="/login" className="policy-back mb-policies-back">
            <ArrowLeft size={18} />
            <span>Back to sign in</span>
          </Link>
          <div className="mb-policies-hero-text">
            <p className="mb-policies-eyebrow">Legal &amp; product</p>
            <h1>MentorBooking policies</h1>
            <p className="policy-lead mb-policies-lead">
              How this academic mentor booking portal works, how we handle data, and what we expect from everyone who
              uses it.
            </p>
          </div>
        </header>

        <div className="mb-policies-picker" role="tablist" aria-label="Policy sections">
          {TAB_ORDER.map((id) => {
            const meta = TAB_META[id];
            const selected = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`mb-policies-card mb-legal-focus ${selected ? "mb-policies-card--active" : ""}`}
                onClick={() => selectTab(id)}
              >
                <span className="mb-policies-card__icon" aria-hidden>
                  {meta.icon}
                </span>
                <span className="mb-policies-card__title">{meta.label}</span>
                <span className="mb-policies-card__blurb">{meta.blurb}</span>
              </button>
            );
          })}
        </div>

        <div className="policy-panel mb-policies-panel" role="tabpanel">
          {activeTab === "terms" && (
            <section className="policy-content mb-policies-content">
              <h2>Terms of Service</h2>
              <p className="policy-updated">Last updated: April 3, 2026 · Demo / coursework content</p>
              <p>
                These Terms govern your access to and use of MentorBooking, an academic web portal for scheduling and
                managing mentoring relationships between mentors (instructors or designated staff) and mentees
                (students) under a single institution or course program. By signing in or continuing to use the service,
                you confirm that you have authority to accept these Terms on behalf of yourself (and, where applicable,
                your organization).
              </p>
              <h3>Scope &amp; roles</h3>
              <p>
                The application separates experiences by role: administrators manage users and oversight; mentors
                publish availability, respond to booking requests, and conduct sessions; mentees discover mentors, submit
                requests, attend meetings, and may leave structured feedback. You may only use features that match the
                role assigned to your account. Attempting to access another role&apos;s data or URLs without authorization
                is prohibited.
              </p>
              <h3>Accounts &amp; security</h3>
              <p>
                Accounts are created or imported by your course or system administrator. You must provide accurate
                profile information when asked and keep your password (and any recovery methods) confidential. You are
                responsible for all activity under your credentials, including bookings, messages, and reviews, unless
                you report unauthorized access promptly to your administrator. Shared or generic accounts are not
                permitted unless explicitly approved in writing by the institution.
              </p>
              <h3>Acceptable use</h3>
              <p>You agree not to:</p>
              <ul>
                <li>Probe, scan, or test the vulnerability of the service, or bypass authentication or rate limits.</li>
                <li>Use bots, scrapers, or bulk exports to harvest data beyond normal personal use of the UI.</li>
                <li>Upload malware, abusive content, or material that infringes intellectual property or privacy rights.</li>
                <li>Harass, threaten, or discriminate against other users, or misuse reviews to retaliate or defame.</li>
                <li>Use the platform for commercial solicitation unrelated to the approved mentoring program.</li>
              </ul>
              <h3>Content &amp; intellectual property</h3>
              <p>
                Materials you submit (for example session notes where enabled, feedback text, or attachments if the
                product supports them) should respect copyright and confidentiality rules of your course. The institution
                may define who owns session materials; in the absence of such rules, you retain your contributions but
                grant the institution a limited license to process them for operating the program.
              </p>
              <h3>Availability &amp; changes</h3>
              <p>
                The service may be updated, limited, or taken offline for maintenance. For coursework or pilot
                deployments, features are provided &quot;as is&quot; without a guaranteed uptime SLA. We may modify these
                Terms or the product; continued use after notice constitutes acceptance of material changes, except where
                applicable law requires a different process.
              </p>
              <h3>Disclaimer &amp; liability</h3>
              <p>
                To the maximum extent permitted by law, MentorBooking (and its developers, as a student or team
                project) is not liable for indirect or consequential damages arising from use of the demo. Your
                institution remains the primary point of contact for academic disputes, grading, and disciplinary
                matters connected to mentoring.
              </p>
            </section>
          )}

          {activeTab === "privacy" && (
            <section className="policy-content mb-policies-content">
              <h2>Privacy Policy</h2>
              <p className="policy-updated">Last updated: April 3, 2026 · Demo / coursework content</p>
              <p>
                This policy describes how MentorBooking handles personal information when you use the portal. The data
                controller for your information is typically your educational institution (or the project sponsor); the
                development team processes data only as needed to deliver the application. If you are unsure who is
                responsible for your deployment, ask your course administrator.
              </p>
              <h3>Categories of data</h3>
              <ul>
                <li>
                  <strong>Identity &amp; account:</strong> email, display name, role (admin, mentor, mentee), and
                  identifiers issued by the backend (user id). Optional fields may include phone or department if your
                  admin configures them.
                </li>
                <li>
                  <strong>Booking &amp; scheduling:</strong> requested and confirmed time ranges, status (pending,
                  approved, declined, cancelled, completed), linked mentor and mentee ids, and any notes the product
                  stores for operational purposes.
                </li>
                <li>
                  <strong>Meetings &amp; communication:</strong> meeting identifiers, online meeting links or locations
                  if entered in the system, and timestamps of updates. We do not record video or audio by default unless
                  your institution integrates a separate tool with its own terms.
                </li>
                <li>
                  <strong>Feedback &amp; reviews:</strong> ratings, text comments, and moderation outcomes visible to
                  roles permitted by the product (for example mentors and administrators).
                </li>
                <li>
                  <strong>Technical &amp; security:</strong> authentication tokens, browser type, error logs, server
                  logs that may include IP address and request paths, and audit events needed to investigate abuse.
                </li>
              </ul>
              <h3>Purposes &amp; legal bases</h3>
              <p>
                We process data to provide login, authorization, dashboards, booking workflows, notifications shown in the
                app, and aggregated reporting for administrators. For formal coursework, processing is usually grounded
                in performing the educational service you requested or in the institution&apos;s legitimate interests in
                running a safe, fair mentoring program—supplemented by local law and institutional policies.
              </p>
              <h3>Sharing &amp; subprocessors</h3>
              <p>
                Data is shared only with parties that need it: other users see information appropriate to their role
                (for example mentees see mentor public profiles; mentors see their own bookings). Hosting, database, or
                email providers used by your deployment act as processors under instructions from the institution. There
                is no sale of personal data for advertising in the default product design.
              </p>
              <h3>Security</h3>
              <p>
                Reasonable technical measures apply, such as HTTPS in transit, access control by role, and hashed or
                protected secrets on the server. No system is perfectly secure; report suspected incidents to your
                administrator immediately.
              </p>
              <h3>Your rights</h3>
              <p>
                Depending on your jurisdiction, you may have rights to access, correct, delete, restrict, or export your
                data, and to object to certain processing. Submit requests through your institution; the team operating
                this demo will respond within reasonable timelines dictated by policy and technical feasibility.
              </p>
              <h3>Retention &amp; deletion</h3>
              <p>
                Records are kept as long as needed for the program and legal obligations. Sandbox or demo environments may
                be wiped between semesters; production-like deployments should document retention in a separate data
                schedule. Ask your administrator before assuming data is permanently deleted.
              </p>
              <h3>International transfers</h3>
              <p>
                If servers or administrators are located outside your country, transfers may rely on standard contractual
                clauses or institutional agreements. This section is informational; your school&apos;s DPA prevails where
                it exists.
              </p>
              <h3>Children</h3>
              <p>
                The service is intended for higher-education or adult professional learners unless your institution
                configures it otherwise. If minors use the system, the institution is responsible for consent and
                safeguards.
              </p>
            </section>
          )}

          {activeTab === "cookies" && (
            <section className="policy-content mb-policies-content">
              <h2>Cookie Policy</h2>
              <p className="policy-updated">Last updated: April 3, 2026 · Demo / coursework content</p>
              <p>
                This page explains how MentorBooking uses browser storage and HTTP cookies. Modern single-page
                applications often rely on <strong>local storage</strong> or <strong>session storage</strong> for
                session tokens and UI state; these are not exactly the same as traditional &quot;cookie&quot; files but
                have a similar effect for your privacy choices (clearing site data removes them).
              </p>
              <h3>Strictly necessary</h3>
              <p>
                Authentication data (for example access and refresh tokens returned by the API after login) may be stored
                so you stay signed in across page views. Without this storage, you would need to log in again frequently.
                These items are treated as essential for the functioning of the application.
              </p>
              <h3>Functional preferences</h3>
              <p>
                The app may remember choices such as theme, language, last-opened tab, or column sort order if the
                feature is implemented. You can usually reset these by clearing site data or through in-app settings
                where available.
              </p>
              <h3>Analytics &amp; performance</h3>
              <p>
                A production deployment might load first-party or third-party scripts to measure page load, errors, or
                feature usage. This coursework build may omit analytics entirely. If your administrator enables tools such
                as Google Analytics, Microsoft Clarity, or Sentry, they should update this section with provider names,
                cookie names, retention periods, and opt-out links.
              </p>
              <h3>Third-party content</h3>
              <p>
                If meeting links point to Zoom, Microsoft Teams, Google Meet, or similar, those services set their own
                cookies when you open them. MentorBooking does not control those environments; review their policies when
                you join external meetings.
              </p>
              <h3>How to control</h3>
              <p>
                Use your browser&apos;s settings to block or delete cookies and site data. Blocking all storage may break
                login. Incognito or private windows discard many storages when you close the window—useful for testing but
                not for long sessions.
              </p>
              <h3>Updates</h3>
              <p>
                When new tracking or marketing technologies are introduced, this policy will be revised and the &quot;Last
                updated&quot; date at the top will change. Material changes may also be announced by your institution.
              </p>
            </section>
          )}

          {activeTab === "conduct" && (
            <section className="policy-content mb-policies-content">
              <h2>Community Guidelines</h2>
              <p className="policy-updated">Last updated: April 3, 2026 · Demo / coursework content</p>
              <p>
                MentorBooking works best when every participant—administrators, mentors, mentees, and guests with
                limited access—treats others with respect, honesty, and professionalism. These guidelines supplement your
                institution&apos;s code of conduct and academic integrity rules; where they conflict, the
                institution&apos;s policies take precedence.
              </p>
              <h3>General expectations</h3>
              <ul>
                <li>Use inclusive language; do not target protected characteristics or engage in bullying.</li>
                <li>Keep communication relevant to learning, career development, or the mentoring relationship.</li>
                <li>Protect confidentiality: do not share another user&apos;s personal story outside the session without consent.</li>
                <li>Report safety concerns or harassment to your administrator or trusted campus resources.</li>
              </ul>
              <h3>Mentors</h3>
              <p>
                Publish accurate availability and keep it current. Respond to booking requests within the timeframe
                your program expects (for example before automatic expiry). Start and end sessions on time; if you must
                cancel, do so as early as possible and propose alternatives when appropriate. Give feedback that is
                specific, actionable, and aligned with learning objectives—not personal criticism unrelated to
                performance. Avoid conflicts of interest, favoritism, or inappropriate one-on-one contact outside
                approved channels.
              </p>
              <h3>Mentees</h3>
              <p>
                Request sessions only when you plan to attend and have done any pre-work. Arrive prepared with questions
                or materials agreed with your mentor. Cancel or reschedule with enough notice for someone else to use the
                slot. Do not create multiple accounts to circumvent limits, spam mentors with duplicate requests, or
                pressure anyone for grades or outcomes beyond the mentor&apos;s role.
              </p>
              <h3>Administrators &amp; staff</h3>
              <p>
                Use administrative powers only for legitimate support, investigation, or compliance. Minimize access to
                sensitive data to what is needed. Document significant moderation decisions where your institution
                requires an audit trail.
              </p>
              <h3>Reviews &amp; ratings</h3>
              <p>
                Reviews should reflect your genuine experience: punctuality, clarity, helpfulness, and respect. Do not post
                profanity, slurs, private information (phone numbers, addresses), or unsubstantiated accusations. Reviews
                are not a channel for grade disputes—use official academic procedures. Administrators may hide, edit, or
                remove content that violates policy or law.
              </p>
              <h3>Academic integrity</h3>
              <p>
                Mentoring should support your learning, not complete graded work for you. Mentors should not encourage
                plagiarism; mentees should not ask mentors to violate assessment rules. Follow your course&apos;s
                collaboration policy.
              </p>
              <h3>Enforcement</h3>
              <p>
                Violations may lead to warnings, temporary suspension of booking privileges, removal of content, or
                escalation to disciplinary processes. Serious misconduct (threats, illegal content) may be reported to law
                enforcement when required.
              </p>
            </section>
          )}

          {activeTab === "bookings" && (
            <section className="policy-content mb-policies-content">
              <h2>Booking &amp; cancellation</h2>
              <p className="policy-updated">Last updated: April 3, 2026 · Demo / coursework content</p>
              <p>
                This section describes the typical lifecycle of a mentoring session in MentorBooking. Exact deadlines,
                quotas, and penalties are configured by your course team in business rules and may differ per semester.
                When in doubt, follow announcements from your instructor or administrator.
              </p>
              <h3>Availability &amp; slots</h3>
              <p>
                Mentors define when they are available (date, time window, duration, capacity). Published slots should
                reflect real availability; mentors are expected to block out holidays or known conflicts proactively.
                Mentees browse or filter mentors according to what the product exposes (subject, department, tags, etc.).
              </p>
              <h3>Requests &amp; workflow</h3>
              <p>
                A mentee submits a booking request for a specific slot or proposes a time if the workflow allows. The
                system records status transitions such as <strong>pending</strong>, <strong>approved</strong>,{" "}
                <strong>declined</strong>, or <strong>cancelled</strong>. Until a request is approved, the same slot may
                still be offered to others depending on implementation—do not assume the time is reserved until you see
                confirmation in the app or receive an institutional notification if configured.
              </p>
              <h3>Confirmations &amp; reminders</h3>
              <p>
                After approval, both parties should see the booking in their dashboards. If email or calendar integration
                exists in your deployment, treat those messages as supplementary; the authoritative record is the status in
                MentorBooking unless your syllabus states otherwise.
              </p>
              <h3>Cancellations &amp; rescheduling</h3>
              <p>
                Either party may cancel according to policy. Good practice: cancel at least 24 hours in advance when
                possible so mentees can rebook and mentors can reclaim time. Some programs enforce minimum notice; late
                cancellations might count toward a &quot;strike&quot; system. Rescheduling may require a new request rather
                than editing the existing record—follow the UI your team shipped.
              </p>
              <h3>No-shows &amp; late arrivals</h3>
              <p>
                A no-show is when a participant does not attend without timely cancellation. Mentors may mark a session
                as missed for record-keeping. Repeated no-shows by mentees can limit future booking rights; repeated
                no-shows by mentors should be escalated to administration. If technical failure prevents joining, document
                it and contact support quickly.
              </p>
              <h3>Meetings &amp; links</h3>
              <p>
                Online meetings may use links generated by Teams, Zoom, Meet, or similar. Links are confidential to
                participants in that booking. Do not post them on social media or share with people not enrolled in the
                session. Do not record sessions unless all participants consent and institutional policy allows it.
              </p>
              <h3>After the session</h3>
              <p>
                Mentors may complete session notes where the feature exists; mentees may be prompted to leave a review.
                Feedback should be honest and respectful. Disputes about what was promised in a session should first be
                discussed directly, then raised with an administrator if unresolved.
              </p>
              <h3>Force majeure &amp; closures</h3>
              <p>
                Campus closures, illness, or emergencies may require bulk cancellations. Administrators may communicate
                alternate arrangements outside the app; users should monitor official channels during disruptions.
              </p>
            </section>
          )}
        </div>

        <footer className="policy-footer mb-policies-footer">
          <p>
            Need access to an account? Contact your course administrator — this demo does not offer public
            self-registration.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default PolicyPage;
