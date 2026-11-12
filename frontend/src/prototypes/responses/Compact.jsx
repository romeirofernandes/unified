import { Disclosure } from "./shared";
export default function Compact({ responses, onIssue }) {
  return <div className="rp-compact-list"><div className="rp-compact-label"><span>Response log</span><span>Newest first</span></div>{responses.map(response => <Disclosure key={response.id} response={response} onIssue={onIssue} style="compact" />)}</div>;
}
