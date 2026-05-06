"use client";

import { useState } from "react";
import Form from "next/form";
import Select from "react-select";
import Character from "./character";
import Report from "./report";
import heroes from "./heroes";

const stateOptions = ["T1", "T2", "Report"];
export const exampleTeam = {
  firstChar: { name: "", artifact: "", hp: "", sets: [], misc: "", cr: "" },
  secondChar: { name: "", artifact: "", hp: "", sets: [], misc: "", cr: "" },
  thirdChar: { name: "", artifact: "", hp: "", sets: [], misc: "", cr: "" },
};

function PlayerSpeedRow({ hero, speed, instanceId, onHeroChange, onSpeedChange }) {
  return (
    <div className="pt-4">
      <p className="text-xs text-gray-400 mb-1">
        Optional — only fill this in if your unit took the first turn in T1. Select that hero and enter their speed to generate enemy speed ranges in the report.
      </p>
      <div className="flex gap-2">
        <div className="flex-1">
          <Select
            options={heroes}
            placeholder="Your hero"
            instanceId={instanceId}
            className="text-black"
            value={hero}
            isClearable
            onChange={onHeroChange}
          />
        </div>
        <input
          type="number"
          placeholder="Your SPD"
          className="border px-2 py-1 rounded-sm w-28"
          value={speed}
          min={1}
          onChange={onSpeedChange}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const [tower, setTower] = useState("");
  const [selected, setSelected] = useState("T1");
  const [t1, setT1] = useState(exampleTeam);
  const [t2, setT2] = useState(exampleTeam);
  const [t1PlayerHero, setT1PlayerHero] = useState(null);
  const [t1PlayerSpeed, setT1PlayerSpeed] = useState("");
  const [t2PlayerHero, setT2PlayerHero] = useState(null);
  const [t2PlayerSpeed, setT2PlayerSpeed] = useState("");

  const handleHeroChange = (hero, setHero, setSpeed) => {
    setHero(hero);
    if (hero) {
      const stored = localStorage.getItem(`lucina_spd_${hero.value}`);
      setSpeed(stored ? Number(stored) : "");
    } else {
      setSpeed("");
    }
  };

  const handleSpeedChange = (e, hero, setSpeed) => {
    const val = e.target.value ? Number(e.target.value) : "";
    setSpeed(val);
    if (hero && val) {
      localStorage.setItem(`lucina_spd_${hero.value}`, val);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-2 sm:px-4 py-4">
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
              className={`px-4 py-2 border-x border-t border-transparent hover:border-white hover:rounded hover:cursor-pointer select-none transition-all active:scale-95 active:opacity-70 ${
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
          <PlayerSpeedRow
            hero={t1PlayerHero}
            speed={t1PlayerSpeed}
            instanceId="t1-player-hero"
            onHeroChange={(h) => handleHeroChange(h, setT1PlayerHero, setT1PlayerSpeed)}
            onSpeedChange={(e) => handleSpeedChange(e, t1PlayerHero, setT1PlayerSpeed)}
          />
          <Character unit={1} info={t1} setInfo={setT1} />
          <div className="h-px w-full bg-[#393E46] mt-8" />
          <Character unit={2} info={t1} setInfo={setT1} />
          <div className="h-px w-full bg-[#393E46] mt-8" />
          <Character unit={3} info={t1} setInfo={setT1} />
        </>
      )}
      {selected === "T2" && (
        <>
          <PlayerSpeedRow
            hero={t2PlayerHero}
            speed={t2PlayerSpeed}
            instanceId="t2-player-hero"
            onHeroChange={(h) => handleHeroChange(h, setT2PlayerHero, setT2PlayerSpeed)}
            onSpeedChange={(e) => handleSpeedChange(e, t2PlayerHero, setT2PlayerSpeed)}
          />
          <Character unit={1} info={t2} setInfo={setT2} />
          <div className="h-px w-full bg-[#393E46] mt-8" />
          <Character unit={2} info={t2} setInfo={setT2} />
          <div className="h-px w-full bg-[#393E46] mt-8" />
          <Character unit={3} info={t2} setInfo={setT2} />
        </>
      )}
      {selected === "Report" && (
        <Report
          t1={t1}
          t2={t2}
          player={tower}
          setT1={setT1}
          setT2={setT2}
          setTower={setTower}
          t1PlayerHero={t1PlayerHero}
          t1PlayerSpeed={t1PlayerSpeed}
          t2PlayerHero={t2PlayerHero}
          t2PlayerSpeed={t2PlayerSpeed}
          setT1PlayerHero={setT1PlayerHero}
          setT1PlayerSpeed={setT1PlayerSpeed}
          setT2PlayerHero={setT2PlayerHero}
          setT2PlayerSpeed={setT2PlayerSpeed}
        />
      )}
    </main>
  );
}
