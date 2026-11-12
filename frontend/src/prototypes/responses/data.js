export const issues = [
  { id: "search", title: "Search older responses", status: "In progress", color: "#5577b5", description: "Find a response by an email address or a phrase without scrolling through the whole list." },
  { id: "radio", title: "Show the selected radio option", status: "Done", color: "#588568", description: "The selected radio dot now uses the widget accent colour in installed projects." },
  { id: "digest", title: "Send a weekly feedback digest", status: "To do", color: "#a66b35", description: "Let teams review a weekly digest alongside the existing hourly and daily schedules." },
];
export const responses = [
  { id: "01", name: "Ava Patel", email: "ava@acme.example", date: "Nov 12, 10:42", initials: "AP", quote: "We have about 200 responses now. I remember someone mentioning exports, but I can’t find their message. Could we search by a word or email?", role: "Product designer", rating: "8 / 10", browser: "Chrome · macOS", issueIds: ["search"] },
  { id: "02", name: "Sam Rivera", email: "sam@acme.example", date: "Nov 12, 09:18", initials: "SR", quote: "The choices do get selected in the feedback widget, but there’s no dot to tell me which one I picked. I keep clicking again to make sure.", role: "Frontend engineer", rating: "6 / 10", browser: "Safari · iOS", issueIds: ["radio"] },
  { id: "03", name: "Jordan Lee", email: "jordan@studio.example", date: "Nov 11, 16:05", initials: "JL", quote: "I’d love a weekly email with the recurring issues. Daily is a little much for our team. Also, a way to search older feedback would save me time.", role: "Founder", rating: "9 / 10", browser: "Firefox · Windows", issueIds: ["digest", "search"] },
  { id: "04", name: "Priya Shah", email: "priya@north.example", date: "Nov 11, 12:30", initials: "PS", quote: "The new form is much easier to fill out on my phone. Being able to leave a note without leaving the page makes a difference.", role: "Customer", rating: "10 / 10", browser: "Chrome · Android", issueIds: [] },
];
