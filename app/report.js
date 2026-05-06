import { useState, useEffect } from "react";
import { exampleTeam } from "./page";
import { speedRange } from "./character";

export default function Report({ player, t1, t2, setT1, setT2, setTower, t1PlayerHero, t1PlayerSpeed, t2PlayerHero, t2PlayerSpeed, setT1PlayerHero, setT1PlayerSpeed, setT2PlayerHero, setT2PlayerSpeed }) {
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!confirmReset) return;
    const t = setTimeout(() => setConfirmReset(false), 10000);
    return () => clearTimeout(t);
  }, [confirmReset]);

  const handleCopy = () => {
    navigator.clipboard.writeText(discordText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setT1(exampleTeam);
    setT2(exampleTeam);
    setTower("");
    setT1PlayerHero(null);
    setT1PlayerSpeed("");
    setT2PlayerHero(null);
    setT2PlayerSpeed("");
    setConfirmReset(false);
  };
  const t1FirstCharName = t1.firstChar.name?.value;
  const t1FirstCharArtifact = t1.firstChar.artifact?.value;
  const t1FirstCharHP = t1.firstChar?.hp;
  const t1FirstCharSets = t1.firstChar?.sets;
  const t1FirstCharMisc = t1.firstChar?.misc;
  const t1SecondCharName = t1.secondChar.name?.value;
  const t1SecondCharArtifact = t1.secondChar.artifact?.value;
  const t1SecondCharHP = t1.secondChar?.hp;
  const t1SecondCharSets = t1.secondChar?.sets;
  const t1SecondCharMisc = t1.secondChar?.misc;
  const t1ThirdCharName = t1.thirdChar.name?.value;
  const t1ThirdCharArtifact = t1.thirdChar.artifact?.value;
  const t1ThirdCharHP = t1.thirdChar?.hp;
  const t1ThirdCharSets = t1.thirdChar?.sets;
  const t1ThirdCharMisc = t1.thirdChar?.misc;
  const t2FirstCharName = t2.firstChar.name?.value;
  const t2FirstCharArtifact = t2.firstChar.artifact?.value;
  const t2FirstCharHP = t2.firstChar?.hp;
  const t2FirstCharSets = t2.firstChar?.sets;
  const t2FirstCharMisc = t2.firstChar?.misc;
  const t2SecondCharName = t2.secondChar.name?.value;
  const t2SecondCharArtifact = t2.secondChar.artifact?.value;
  const t2SecondCharHP = t2.secondChar?.hp;
  const t2SecondCharSets = t2.secondChar?.sets;
  const t2SecondCharMisc = t2.secondChar?.misc;
  const t2ThirdCharName = t2.thirdChar.name?.value;
  const t2ThirdCharArtifact = t2.thirdChar.artifact?.value;
  const t2ThirdCharHP = t2.thirdChar?.hp;
  const t2ThirdCharSets = t2.thirdChar?.sets;
  const t2ThirdCharMisc = t2.thirdChar?.misc;

  const textBuilder = () => {
    const fmt = (hp) =>
      hp
        ? `${new Intl.NumberFormat("en", {
            notation: "compact",
            roundingMode: "ceil",
            maximumFractionDigits: 2,
          }).format(hp)} HP`
        : null;

    const charString = (name, artifact, hp, sets, cr, misc, playerSpeed, heroName) =>
      [
        name,
        artifact,
        fmt(hp),
        sets.map((s) => s.value).join(" + "),
        speedRange(playerSpeed, cr, heroName),
        misc,
      ]
        .filter(Boolean)
        .join(" - ");

    const t1Hero = t1PlayerHero?.value;
    const t2Hero = t2PlayerHero?.value;

    const t1FirstCharString = charString(t1FirstCharName, t1FirstCharArtifact, t1FirstCharHP, t1FirstCharSets, t1.firstChar.cr, t1FirstCharMisc, t1PlayerSpeed, t1Hero);
    const t1SecondCharString = charString(t1SecondCharName, t1SecondCharArtifact, t1SecondCharHP, t1SecondCharSets, t1.secondChar.cr, t1SecondCharMisc, t1PlayerSpeed, t1Hero);
    const t1ThirdCharString = charString(t1ThirdCharName, t1ThirdCharArtifact, t1ThirdCharHP, t1ThirdCharSets, t1.thirdChar.cr, t1ThirdCharMisc, t1PlayerSpeed, t1Hero);
    const t2FirstCharString = charString(t2FirstCharName, t2FirstCharArtifact, t2FirstCharHP, t2FirstCharSets, t2.firstChar.cr, t2FirstCharMisc, t2PlayerSpeed, t2Hero);
    const t2SecondCharString = charString(t2SecondCharName, t2SecondCharArtifact, t2SecondCharHP, t2SecondCharSets, t2.secondChar.cr, t2SecondCharMisc, t2PlayerSpeed, t2Hero);
    const t2ThirdCharString = charString(t2ThirdCharName, t2ThirdCharArtifact, t2ThirdCharHP, t2ThirdCharSets, t2.thirdChar.cr, t2ThirdCharMisc, t2PlayerSpeed, t2Hero);

    return `${player && `# ${player}`}
${
  t1FirstCharString.length ||
  t1SecondCharString.length ||
  t1ThirdCharString.length
    ? "**T1**"
    : ""
}
${[t1FirstCharString, t1SecondCharString, t1ThirdCharString].join("\n").trim()}

${
  t2FirstCharString.length ||
  t2SecondCharString.length ||
  t2ThirdCharString.length
    ? "**T2**"
    : ""
}
${[t2FirstCharString, t2SecondCharString, t2ThirdCharString]
  .join("\n")
  .trim()}`.trim();
  };

  const discordText = textBuilder();

  return (
    <section className="mt-8">
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          className="border px-2 py-1 rounded-sm cursor-pointer hover:bg-[#393E46] transition-all active:scale-95 active:opacity-70 w-24"
          onClick={handleCopy}
        >
          {copied ? "Copied!" : "Copy Text"}
        </button>
        {confirmReset ? (
          <div className="flex gap-2">
            <button
              className="border border-red-400 text-red-400 px-2 py-1 rounded-sm cursor-pointer hover:bg-red-400 hover:text-white transition-all active:scale-95"
              onClick={handleReset}
            >
              Confirm Reset
            </button>
            <button
              className="border px-2 py-1 rounded-sm cursor-pointer hover:bg-[#393E46] transition-all active:scale-95 active:opacity-70"
              onClick={() => setConfirmReset(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="border px-2 py-1 rounded-sm cursor-pointer hover:bg-[#393E46] transition-all active:scale-95 active:opacity-70"
            onClick={() => setConfirmReset(true)}
          >
            Reset Form
          </button>
        )}
      </div>
      <textarea
        className="border w-full rounded-sm p-2 h-64 sm:h-80 mt-4"
        value={discordText}
        readOnly
      />
    </section>
  );
}
