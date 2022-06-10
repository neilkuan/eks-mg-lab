const { awscdk } = require('projen');
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '1.136.0',
  defaultReleaseBranch: 'main',
  name: 'eks-mg-lab',
  authorName: 'Neil Kuan',
  authorEmail: 'guan840912@gmail.com',
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-eks',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-ssm',
    '@aws-cdk/assertions',
  ],
  depsUpgradeOptions: {
    workflowOptions: {
      labels: ['auto-approve'],
    },
  },
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['neilkuan'],
  },
  typescriptVersion: '4.6',
  deps: [
    'cdk8s-aws-load-balancer-controller',
    'constructs',
    'cdk8s',
    '@types/prettier@2.6.0',
  ],
  gitignore: ['cdk.out', 'images', 'cdk.context.json'],
  workflowBootstrapSteps: [
    {
      name: 'Install Helm',
      id: 'install_helm',
      run: `curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh
helm repo add eks https://aws.github.io/eks-charts
helm repo update`,
    },
  ],
});

project.synth();
