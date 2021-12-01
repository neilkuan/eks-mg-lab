const { AwsCdkTypeScriptApp } = require('projen');
const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.121.0',
  defaultReleaseBranch: 'main',
  name: 'eks-mg-lab',
  authorName: 'Neil Kuan',
  authorEmail: 'guan840912@gmail.com',
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-eks',
    '@aws-cdk/aws-iam',
  ],
  depsUpgrade: {
    workflowOptions: {
      labels: ['auto-approve'],
      secret: 'AUTOMATION_GITHUB_TOKEN',
    },
  },
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['neilkuan'],
  },
  deps: [
    'cdk8s-aws-load-balancer-controller',
    'constructs',
    'cdk8s',
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