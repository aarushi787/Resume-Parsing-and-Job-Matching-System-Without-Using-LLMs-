'use strict';

/**
 * Comprehensive tech skills dictionary for rule-based extraction.
 * Organized by category. All entries are lowercased for matching.
 */

const SKILLS_DB = {
  languages: [
    'python', 'java', 'javascript', 'typescript', 'c', 'c++', 'c#', 'go', 'golang',
    'rust', 'kotlin', 'swift', 'scala', 'ruby', 'php', 'r', 'matlab', 'perl',
    'fortran', 'cobol', 'haskell', 'elixir', 'erlang', 'dart', 'lua', 'julia',
    'shell', 'bash', 'powershell', 'groovy', 'objective-c', 'assembly', 'vhdl',
    'verilog', 'sql', 'plsql', 'tsql', 'hack', 'apex', 'solidity'
  ],

  frontend: [
    'html', 'css', 'react', 'angular', 'vue', 'vuejs', 'angularjs', 'svelte',
    'jquery', 'bootstrap', 'tailwind', 'sass', 'less', 'webpack', 'vite',
    'next.js', 'nextjs', 'nuxt', 'gatsby', 'ember', 'backbone', 'redux',
    'mobx', 'graphql', 'apollo', 'storybook', 'figma', 'd3', 'd3.js',
    'three.js', 'webgl', 'websocket', 'pwa', 'electron', 'jsx', 'tsx',
    'material-ui', 'mui', 'ant design', 'chakra ui', 'styled-components'
  ],

  backend: [
    'node.js', 'nodejs', 'express', 'expressjs', 'fastapi', 'flask', 'django',
    'spring', 'spring boot', 'springboot', 'laravel', 'rails', 'ruby on rails',
    'asp.net', 'dotnet', '.net', 'nest.js', 'nestjs', 'koa', 'hapi',
    'gin', 'fiber', 'actix', 'rocket', 'grpc', 'rest api', 'restful',
    'graphql', 'soap', 'microservices', 'serverless', 'lambda', 'fastify',
    'strapi', 'hibernate', 'jpa', 'mybatis', 'sequelize', 'prisma', 'typeorm'
  ],

  databases: [
    'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'elasticsearch',
    'oracle', 'sqlite', 'mssql', 'microsoft sql server', 'cassandra', 'dynamodb',
    'couchdb', 'firebase', 'supabase', 'neo4j', 'influxdb', 'timescaledb',
    'mariadb', 'cockroachdb', 'planetscale', 'db2', 'hbase', 'clickhouse',
    'snowflake', 'bigquery', 'redshift', 'aurora', 'cosmosdb', 'fauna',
    'memcached', 'rethinkdb', 'arangodb', 'couchbase'
  ],

  cloud: [
    'aws', 'azure', 'gcp', 'google cloud', 'digitalocean', 'heroku', 'vercel',
    'netlify', 'cloudflare', 'linode', 'ibm cloud', 'alibaba cloud',
    'lambda', 'ec2', 's3', 'rds', 'ecs', 'eks', 'fargate', 'cloudfront',
    'route53', 'sqs', 'sns', 'api gateway', 'azure functions', 'azure devops',
    'google kubernetes engine', 'gke', 'cloud run', 'cloud functions',
    'terraform', 'pulumi', 'cloudformation', 'bicep'
  ],

  devops: [
    'docker', 'kubernetes', 'k8s', 'jenkins', 'gitlab ci', 'github actions',
    'circleci', 'travis ci', 'ansible', 'puppet', 'chef', 'terraform',
    'helm', 'argo cd', 'argocd', 'prometheus', 'grafana', 'elk stack',
    'elasticsearch', 'logstash', 'kibana', 'datadog', 'splunk', 'new relic',
    'nginx', 'apache', 'haproxy', 'istio', 'linkerd', 'vault', 'consul',
    'vagrant', 'packer', 'sonarqube', 'nexus', 'artifactory', 'ci/cd',
    'devops', 'devsecops', 'sre', 'site reliability'
  ],

  messaging: [
    'kafka', 'rabbitmq', 'activemq', 'redis pub/sub', 'nats', 'zeromq',
    'apache kafka', 'amazon sqs', 'google pub/sub', 'mqtt', 'websocket',
    'grpc', 'message queue', 'event-driven', 'event streaming'
  ],

  mlai: [
    'machine learning', 'deep learning', 'neural networks', 'tensorflow',
    'pytorch', 'keras', 'scikit-learn', 'sklearn', 'pandas', 'numpy',
    'opencv', 'nlp', 'computer vision', 'reinforcement learning',
    'transformers', 'hugging face', 'bert', 'gpt', 'llm', 'mlops',
    'data science', 'data engineering', 'feature engineering', 'spark',
    'hadoop', 'hive', 'airflow', 'mlflow', 'kubeflow', 'xgboost',
    'lightgbm', 'catboost', 'rapids', 'cuda', 'gpu programming'
  ],

  testing: [
    'junit', 'jest', 'pytest', 'mocha', 'chai', 'jasmine', 'selenium',
    'cypress', 'playwright', 'testng', 'mockito', 'enzyme', 'testing library',
    'postman', 'jmeter', 'k6', 'locust', 'sonarqube', 'tdd', 'bdd',
    'unit testing', 'integration testing', 'e2e testing', 'test automation',
    'qa', 'quality assurance', 'rtos'
  ],

  vcs: [
    'git', 'github', 'gitlab', 'bitbucket', 'svn', 'mercurial', 'clearcase',
    'perforce', 'version control', 'git flow', 'trunk based development'
  ],

  methodologies: [
    'agile', 'scrum', 'kanban', 'lean', 'waterfall', 'devops', 'sdlc',
    'ci/cd', 'tdd', 'bdd', 'ddd', 'solid', 'microservices', 'soa',
    'event-driven architecture', 'cqrs', 'event sourcing', 'twelve-factor'
  ],

  embedded: [
    'embedded systems', 'rtos', 'fpga', 'arduino', 'raspberry pi',
    'microcontroller', 'arm', 'risc-v', 'mpi', 'openmp', 'cuda',
    'hpc', 'high performance computing', 'parallel programming',
    'signal processing', 'dsp', 'plc', 'scada', 'modbus', 'canbus',
    'iot', 'zigbee', 'bluetooth', 'mqtt', 'firmware'
  ],

  security: [
    'cybersecurity', 'penetration testing', 'owasp', 'sso', 'oauth',
    'jwt', 'ssl/tls', 'encryption', 'pki', 'siem', 'soar', 'iam',
    'zero trust', 'devsecops', 'vulnerability assessment', 'soc'
  ],

  other: [
    'linux', 'unix', 'windows', 'macos', 'bash scripting', 'shell scripting',
    'regex', 'xml', 'json', 'yaml', 'protobuf', 'avro', 'parquet',
    'rest', 'soap', 'api', 'sdk', 'cli', 'oop', 'functional programming',
    'design patterns', 'data structures', 'algorithms', 'system design',
    'distributed systems', 'load balancing', 'caching', 'cdn',
    'typescript', 'ui/ux', 'full stack', 'backend', 'frontend',
    'elastic search', 'kibana', 'logstash', 'prometheus', 'grafana',
    'activemq', 'node js', 'react js', 'vue js', 'angular js',
    'c sharp', 'dotnet core', 'net core', 'asp net', 'wpf', 'uwp',
    'protobuf', 'thrift', 'avro', 'parquet', 'orc',
    'power bi', 'tableau', 'looker', 'metabase', 'superset',
    'jira', 'confluence', 'notion', 'slack', 'teams'
  ]
};

// Flatten all skills into a single sorted list (longest first for greedy matching)
const ALL_SKILLS = Object.values(SKILLS_DB)
  .flat()
  .filter((skill, index, arr) => arr.indexOf(skill) === index) // deduplicate
  .sort((a, b) => b.length - a.length); // longest first for greedy match

// Skill aliases/normalizations
const SKILL_ALIASES = {
  'node js': 'Node.js',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  'reactjs': 'React',
  'react js': 'React',
  'react.js': 'React',
  'vuejs': 'Vue.js',
  'vue js': 'Vue.js',
  'angularjs': 'Angular',
  'angular js': 'Angular',
  'springboot': 'Spring Boot',
  'spring boot': 'Spring Boot',
  'postgresql': 'PostgreSQL',
  'postgres': 'PostgreSQL',
  'mongodb': 'MongoDB',
  'mysql': 'MySQL',
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'python': 'Python',
  'java': 'Java',
  'golang': 'Go',
  'c++': 'C++',
  'c#': 'C#',
  'dotnet': '.NET',
  '.net': '.NET',
  'kubernetes': 'Kubernetes',
  'k8s': 'Kubernetes',
  'docker': 'Docker',
  'aws': 'AWS',
  'gcp': 'GCP',
  'azure': 'Azure',
  'git': 'Git',
  'linux': 'Linux',
  'bash': 'Bash',
  'redis': 'Redis',
  'kafka': 'Kafka',
  'elasticsearch': 'Elasticsearch',
  'elastic search': 'Elasticsearch',
  'machine learning': 'Machine Learning',
  'deep learning': 'Deep Learning',
  'sql': 'SQL',
  'rest api': 'REST API',
  'restful': 'REST API',
  'graphql': 'GraphQL',
  'grpc': 'gRPC',
  'ci/cd': 'CI/CD',
  'jenkins': 'Jenkins',
  'terraform': 'Terraform',
  'ansible': 'Ansible',
  'agile': 'Agile',
  'scrum': 'Scrum',
  'microservices': 'Microservices',
  'c': 'C',
  'fortran': 'Fortran',
  'mpi': 'MPI',
  'openmp': 'OpenMP',
  'cuda': 'CUDA',
  'fpga': 'FPGA',
  'pytorch': 'PyTorch',
  'tensorflow': 'TensorFlow',
  'scikit-learn': 'scikit-learn',
  'sklearn': 'scikit-learn',
  'pandas': 'Pandas',
  'numpy': 'NumPy',
  'rabbitmq': 'RabbitMQ',
  'activemq': 'ActiveMQ',
  'protobuf': 'Protobuf',
  'yaml': 'YAML',
  'json': 'JSON',
  'db2': 'DB2',
  'hbase': 'HBase',
  'spark': 'Apache Spark',
  'hadoop': 'Hadoop',
  'cassandra': 'Cassandra',
  'dynamodb': 'DynamoDB',
  'rtos': 'RTOS',
  'hpc': 'HPC',
  'svn': 'SVN',
  'clearcase': 'ClearCase',
  'selenium': 'Selenium',
  'jest': 'Jest',
  'junit': 'JUnit',
  'pytest': 'pytest',
  'ui/ux': 'UI/UX',
  'full stack': 'Full Stack',
};

/**
 * Normalize a skill name to its canonical form.
 * @param {string} skill
 * @returns {string}
 */
function normalizeSkill(skill) {
  const lower = skill.toLowerCase().trim();
  return SKILL_ALIASES[lower] || skill.trim();
}

module.exports = { SKILLS_DB, ALL_SKILLS, SKILL_ALIASES, normalizeSkill };
