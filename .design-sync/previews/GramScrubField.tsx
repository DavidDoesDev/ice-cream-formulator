import { GramScrubField } from "ice-cream-formulator";

// A gram value you drag vertically to change, or click to type. Controlled, so
// each cell shows a fixed weight; the unit suffix and numeric field are the tell.
export const Default = () => <GramScrubField grams={250} onChange={() => {}} />;
export const Large = () => <GramScrubField grams={1000} onChange={() => {}} />;
export const Trace = () => <GramScrubField grams={5} onChange={() => {}} step={1} />;
