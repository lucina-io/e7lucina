"use client";

import { useState } from "react";
import Form from "next/form";
import Character from "./character";
import Report from "./report";

const stateOptions = ["T1", "T2", "Report"];
const exampleTeam = {
  firstChar: { name: "", artifact: "", hp: "", sets: [], misc: "" },
  secondChar: { name: "", artifact: "", hp: "", sets: [], misc: "" },
  thirdChar: { name: "", artifact: "", hp: "", sets: [], misc: "" },
};

export default function Home() {
  const [tower, setTower] = useState("");
  const [selected, setSelected] = useState("T1");
  const [t1, setT1] = useState(exampleTeam);
  const [t2, setT2] = useState(exampleTeam);

  return (
    <main className="max-w-5xl mx-auto py-4">
      <section className="">
        <Form>
          <input
            className="border px-2 py-1 rounded-sm w-full"
            placeholder="Name of tower"
            value={tower}
            onChange={(e) => setTower(e.target.value)}
          />
        </Form>
      </section>
      <section className="pt-4">
        <ul className="flex border-b">
          {stateOptions.map((option) => (
            <li
              className={`px-4 py-2 border-x border-t border-transparent hover:border-white hover:rounded hover:cursor-pointer ${
                selected === option &&
                "border-white rounded-x-sm rounded-t-sm bg-[#393E46]"
              }`}
              onClick={(e) => setSelected(e.target.innerText)}
              key={option}
            >
              {option}
            </li>
          ))}
        </ul>
      </section>
      {selected === "T1" && (
        <>
          <Character unit={1} info={t1} setInfo={setT1} />
          <div className="h-px w-full bg-[#393E46] mt-8" />
          <Character unit={2} info={t1} setInfo={setT1} />
          <div className="h-px w-full bg-[#393E46] mt-8" />
          <Character unit={3} info={t1} setInfo={setT1} />
        </>
      )}
      {selected === "T2" && (
        <>
          <Character unit={1} info={t2} setInfo={setT2} />
          <div className="h-px w-full bg-[#393E46] mt-8" />
          <Character unit={2} info={t2} setInfo={setT2} />
          <div className="h-px w-full bg-[#393E46] mt-8" />
          <Character unit={3} info={t2} setInfo={setT2} />
        </>
      )}
      {selected === "Report" && <Report t1={t1} t2={t2} player={tower} />}
    </main>
  );
}
