module.exports = {
  plugins: {
    'postcss-import': {
      resolve: (id, basedir, importOptions) => {
        // Resolve @ alias to src directory
        if (id.startsWith('@/')) {
          return require('path').resolve(__dirname, 'src', id.substring(2));
        }
        return id;
      },
    },
    tailwindcss: {},
    autoprefixer: {},
  },
};
