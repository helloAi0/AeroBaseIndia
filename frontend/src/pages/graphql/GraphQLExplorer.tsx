import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { graphqlQuery } from "../../api/client";
import { Code2, Play, BookOpen, ChevronRight, Copy, CheckCircle } from "lucide-react";

const EXAMPLES = [
  { label: "Health Status", query: `{ healthStatus { api database redis } }` },
  { label: "All Flights", query: `{ flights { flightNumber origin destination status gate } }` },
  { label: "Flight by ID", query: `{ flightById(id: "FLIGHT_ID") { flightNumber status predictedDelay } }` },
  { label: "Tenant Info", query: `{ tenantInfo(tenantId: "DEL") { tenantId airportName totalFlights } }` },
  { label: "Revenue Metrics", query: `{ revenueMetrics(tenantId: "DEL") { tenantId totalUsage currency } }` },
];

export function GraphQLExplorer() {
  const [query, setQuery] = useState(EXAMPLES[0].query);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const mut = useMutation({
    mutationFn: (q: string) => graphqlQuery(q),
    onSuccess: (data) => setResult(data),
    // Standardized key structurally so it acts like a native GraphQL execution error array
    onError: (err) => setResult({ errors: [{ message: String(err) }] }),
  });

  const run = () => mut.mutate(query);

  const copy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Safely catches both inline GraphQL validation errors and system/network errors
  const hasErrors = !!(result?.errors || result?.error);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">GraphQL Explorer</h1>
        <p className="text-slate-400 text-sm mt-0.5">Interactive in-browser GraphQL client</p>
      </div>

      
      <div>
        <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5"/>Example queries
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map(e => (
            <button key={e.label} onClick={() => setQuery(e.query)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all border ${
                query === e.query
                  ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                  : "bg-navy-800 text-slate-400 border-navy-600 hover:border-navy-500 hover:text-white"
              }`}>
              <ChevronRight className="w-3 h-3"/>
              {e.label}
            </button>
          ))}
        </div>
      </div>

      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        
        <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-navy-600 bg-navy-700/50">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-sky-400"/>
              <span className="text-sm font-medium text-white">Query Editor</span>
            </div>
            <button onClick={run} disabled={mut.isPending}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors">
              <Play className="w-3.5 h-3.5 fill-current"/>
              {mut.isPending ? "Running..." : "Run Query"}
            </button>
          </div>
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.ctrlKey && e.key === "Enter") run(); }}
            className="w-full h-80 bg-navy-900 text-sky-300 font-mono text-sm p-5 outline-none resize-none leading-relaxed"
            placeholder="Enter your GraphQL query..."
            spellCheck={false}
          />
          <div className="px-4 py-2 border-t border-navy-600 bg-navy-700/30">
            <span className="text-xs text-slate-500">Ctrl+Enter to run</span>
          </div>
        </div>

        
        <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-navy-600 bg-navy-700/50">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                hasErrors ? "bg-red-400" : result ? "bg-green-400 animate-pulse" : "bg-slate-500"
              }`}/>
              <span className="text-sm font-medium text-white">Response</span>
              {result && !hasErrors && (
                <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                  200 OK
                </span>
              )}
              {hasErrors && (
                <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                  Error
                </span>
              )}
            </div>
            {result && (
              <button onClick={copy}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400"/> : <Copy className="w-3.5 h-3.5"/>}
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          <div className="h-80 overflow-auto p-5 font-mono text-sm">
            {mut.isPending && (
              <div className="flex items-center gap-3 text-slate-400">
                <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"/>
                Executing query...
              </div>
            )}
            {!mut.isPending && !result && (
              <div className="text-slate-500 text-center mt-16">
                <Code2 className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                <p>Run a query to see results</p>
              </div>
            )}
            {result && (
              <pre className={`whitespace-pre-wrap text-xs leading-relaxed ${
                hasErrors ? "text-red-300" : "text-green-300"
              }`}>
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>

      
      <div className="bg-navy-800 rounded-2xl border border-navy-600 p-5">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-sky-400"/> Schema Reference
        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {[
            { name: "healthStatus", args: "none", returns: "api, database, redis (strings)" },
            { name: "flights", args: "tenantId?", returns: "flightNumber, origin, destination, status, gate" },
            { name: "flightById", args: "id: String!", returns: "flightNumber, status, predictedDelay" },
            { name: "tenantInfo", args: "tenantId?", returns: "tenantId, airportName, totalFlights" },
            { name: "revenueMetrics", args: "tenantId?", returns: "tenantId, totalUsage, currency" },
          ].map(({ name, args, returns }) => (
            <div key={name} className="p-4 bg-navy-700/50 rounded-xl border border-navy-600/50">
              <div className="font-mono text-sky-300 font-bold text-sm mb-1">{name}</div>
              <div className="text-xs text-slate-500 mb-2">Args: <span className="text-slate-400">{args}</span></div>
              <div className="text-xs text-slate-500">Returns: <span className="text-slate-400">{returns}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}