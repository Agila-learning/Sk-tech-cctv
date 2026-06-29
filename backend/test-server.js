const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Mini server running'));
app.listen(5001, () => console.log('Mini server on 5001'));
