const platformTemplates = {
  'veo-3.1': {
    name: 'Veo 3.1'
  },
  'sora-2': {
    name: 'Sora 2'
  }
};

export default function handler(req, res) {
  const platforms = Object.entries(platformTemplates).map(([id, template]) => ({
    id,
    name: template.name
  }));
  res.json(platforms);
}
