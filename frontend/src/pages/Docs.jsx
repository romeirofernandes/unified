import React from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import { RiCodeLine, RiPaletteLine, RiQuestionLine } from "react-icons/ri";

const Docs = () => {
  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-12">
        <div>
          <h2 className="text-2xl font-bold mb-2">Documentation</h2>
          <p className="text-[#e5e5e5]/60">
            Learn how to integrate and customize Unified in your application.
          </p>
        </div>

        {/* Quick Start */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <RiCodeLine className="text-[#f59e0b]" />
            Quick Start
          </h3>
          <div className="space-y-4">
            <div className="p-6 rounded-xl bg-[#262626] border border-[#404040] space-y-4">
              <h4 className="font-medium">1. Installation</h4>
              <pre className="bg-[#171717] p-4 rounded-lg overflow-x-auto">
                <code>npm install unified-sdk</code>
              </pre>
            </div>

            <div className="p-6 rounded-xl bg-[#262626] border border-[#404040] space-y-4">
              <h4 className="font-medium">2. Basic Usage</h4>
              <pre className="bg-[#171717] p-4 rounded-lg overflow-x-auto">
                <code>{`import { UnifiedFeedback } from 'unified-sdk';

function App() {
  return (
    <UnifiedFeedback 
      projectId="your-project-id"
      theme="light"
      firebaseUid="your-firebase-uid"
    />
  );
}`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Configuration */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <RiPaletteLine className="text-[#f59e0b]" />
            Configuration
          </h3>
          <div className="p-6 rounded-xl bg-[#262626] border border-[#404040] space-y-6">
            <div className="space-y-2">
              <h4 className="font-medium">Props</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[#404040]">
                    <th className="pb-2 text-[#e5e5e5]/60">Prop</th>
                    <th className="pb-2 text-[#e5e5e5]/60">Type</th>
                    <th className="pb-2 text-[#e5e5e5]/60">Description</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr>
                    <td className="py-3 text-[#f59e0b]">projectId</td>
                    <td>string</td>
                    <td>Your project's unique identifier</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-[#f59e0b]">theme</td>
                    <td>string</td>
                    <td>"light" or "dark" theme option</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-[#f59e0b]">firebaseUid</td>
                    <td>string</td>
                    <td>Your Firebase user ID for authentication</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <RiQuestionLine className="text-[#f59e0b]" />
            FAQ
          </h3>
          <div className="space-y-4">
            {[
              {
                q: "How do I get my Project ID?",
                a: "You can find your Project ID in the project preview modal or in the project's feedback page URL.",
              },
              {
                q: "How do I customize the form fields?",
                a: "Form fields can be customized when creating or editing a project through the dashboard interface.",
              },
              {
                q: "Can I change themes dynamically?",
                a: "Yes, the theme prop can be updated dynamically to switch between light and dark modes.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl bg-[#262626] border border-[#404040] space-y-2"
              >
                <h4 className="font-medium">{item.q}</h4>
                <p className="text-[#e5e5e5]/60">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Docs;
