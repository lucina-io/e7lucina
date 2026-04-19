import Form from "next/form";
import Select from "react-select";
import heroes from "./heroes";
import artifacts from "./artifacts";
import sets from "./sets";

export default function Character({ unit, info, setInfo }) {
  let number = null;

  switch (unit) {
    case 1:
      number = "firstChar";
      break;
    case 2:
      number = "secondChar";
      break;
    case 3:
      number = "thirdChar";
      break;
    default:
      break;
  }

  const updateTeam = (field, val) => {
    const updatedTeam = structuredClone(info);
    updatedTeam[number][field] = val;

    setInfo(updatedTeam);
  };

  const defaultHero = info[number].name;
  const defaultArti = info[number].artifact;
  const defaultHp = info[number].hp;
  const defaultSets = info[number].sets;
  const defaultMisc = info[number].misc;

  return (
    <section className="pt-8">
      <Form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1.5fr_1fr] gap-4">
        <Select
          options={heroes}
          className="text-black"
          placeholder="Character"
          value={defaultHero}
          isClearable
          onChange={(hero) => updateTeam("name", hero)}
        />
        <Select
          options={artifacts}
          className="text-black"
          placeholder="Artifact"
          value={defaultArti && defaultArti}
          isClearable
          onChange={(artifact) => updateTeam("artifact", artifact)}
        />
        <input
          type="number"
          placeholder="HP"
          className="border px-2 py-1 rounded-sm"
          value={defaultHp > 0 ? defaultHp : ""}
          min={1}
          onChange={(hp) => {
            updateTeam("hp", Number(hp.target.value));
          }}
        />
        <Select
          options={sets}
          className="text-black"
          placeholder="Set/s"
          value={defaultSets}
          isClearable
          isMulti
          onChange={(sets) => updateTeam("sets", sets)}
        />
        <input
          type="text"
          placeholder="Extra info: EEs, high eff/er, etc."
          className="border px-2 py-1 rounded-sm col-span-1 md:col-span-2"
          value={defaultMisc}
          onChange={(misc) => updateTeam("misc", misc.target.value)}
        />
      </Form>
    </section>
  );
}
