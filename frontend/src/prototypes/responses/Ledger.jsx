import { Disclosure } from "./shared";
export default function Ledger({ responses, onIssue }) {
  return <div className="rp-ledger-list"><div className="rp-table-head"><span>Customer</span><span>Response</span><span>Received</span></div>{responses.map((response, i) => <Disclosure key={response.id} response={response} onIssue={onIssue} defaultOpen={i === 0} />)}</div>;
}
