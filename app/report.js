const exampleTeam = {
  firstChar: { name: "", artifact: "", hp: "", sets: [], misc: "" },
  secondChar: { name: "", artifact: "", hp: "", sets: [], misc: "" },
  thirdChar: { name: "", artifact: "", hp: "", sets: [], misc: "" },
};

export default function Report({ player, t1, t2 }) {
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
    const t1FirstCharString = [
      t1FirstCharName,
      t1FirstCharArtifact,
      t1FirstCharHP &&
        `${new Intl.NumberFormat("en", {
          notation: "compact",
          roundingMode: "ceil",
          maximumFractionDigits: 2,
        }).format(t1FirstCharHP)} HP`,
      t1FirstCharSets.map((set) => set.value).join(" + "),
      t1FirstCharMisc,
    ]
      .filter(Boolean)
      .join(" - ");

    const t1SecondCharString = [
      t1SecondCharName,
      t1SecondCharArtifact,
      t1SecondCharHP &&
        `${new Intl.NumberFormat("en", {
          notation: "compact",
          roundingMode: "ceil",
          maximumFractionDigits: 2,
        }).format(t1SecondCharHP)} HP`,
      t1SecondCharSets.map((set) => set.value).join(" + "),
      t1SecondCharMisc,
    ]
      .filter(Boolean)
      .join(" - ");

    const t1ThirdCharString = [
      t1ThirdCharName,
      t1ThirdCharArtifact,
      t1ThirdCharHP &&
        `${new Intl.NumberFormat("en", {
          notation: "compact",
          roundingMode: "ceil",
          maximumFractionDigits: 2,
        }).format(t1ThirdCharHP)} HP`,
      t1ThirdCharSets.map((set) => set.value).join(" + "),
      t1ThirdCharMisc,
    ]
      .filter(Boolean)
      .join(" - ");

    const t2FirstCharString = [
      t2FirstCharName,
      t2FirstCharArtifact,
      t2FirstCharHP &&
        `${new Intl.NumberFormat("en", {
          notation: "compact",
          roundingMode: "ceil",
          maximumFractionDigits: 2,
        }).format(t2FirstCharHP)} HP`,
      t2FirstCharSets.map((set) => set.value).join(" + "),
      t2FirstCharMisc,
    ]
      .filter(Boolean)
      .join(" - ");

    const t2SecondCharString = [
      t2SecondCharName,
      t2SecondCharArtifact,
      t2SecondCharHP &&
        `${new Intl.NumberFormat("en", {
          notation: "compact",
          roundingMode: "ceil",
          maximumFractionDigits: 2,
        }).format(t2SecondCharHP)} HP`,
      t2SecondCharSets.map((set) => set.value).join(" + "),
      t2SecondCharMisc,
    ]
      .filter(Boolean)
      .join(" - ");

    const t2ThirdCharString = [
      t2ThirdCharName,
      t2ThirdCharArtifact,
      t2ThirdCharHP &&
        `${new Intl.NumberFormat("en", {
          notation: "compact",
          roundingMode: "ceil",
          maximumFractionDigits: 2,
        }).format(t2ThirdCharHP)} HP`,
      t2ThirdCharSets.map((set) => set.value).join(" + "),
      t2ThirdCharMisc,
    ]
      .filter(Boolean)
      .join(" - ");

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
      <button
        className="border px-2 py-1 rounded-sm cursor-pointer hover:bg-[#393E46]"
        onClick={() => navigator.clipboard.writeText(discordText)}
      >
        Copy Text
      </button>
      <textarea
        className="border w-full rounded-sm p-2 h-80 mt-4"
        value={discordText}
        readOnly
      />
    </section>
  );
}
