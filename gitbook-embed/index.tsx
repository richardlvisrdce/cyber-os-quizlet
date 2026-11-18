import { createComponent, createIntegration } from "@gitbook/runtime";

const quizlet = createComponent({
  componentId: "quizlet",
  async render() {
    return (
      <block>
        <webframe
          source={{ url: "https://richardlvisrdce.github.io/cyber-os-quizlet/" }}
          aspectRatio={0.8}
        />
      </block>
    );
  },
});

export default createIntegration({ components: [quizlet] });
