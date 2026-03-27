import os
import subprocess
import json
import time

def run_command(cmd, env):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, env=env)
    if result.returncode != 0:
        return None
    return result.stdout

def setup_aws():
    print("🚀 Starting AWS Automated Setup (Fixed)...")

    # 1. Load credentials from .env
    with open("backend/.env", "r") as f:
        lines = f.readlines()
    
    config = {}
    for line in lines:
        if "=" in line and not line.startswith("#"):
            k, v = line.strip().split("=", 1)
            config[k] = v

    env = os.environ.copy()
    env["AWS_ACCESS_KEY_ID"] = config.get("AWS_ACCESS_KEY_ID")
    env["AWS_SECRET_ACCESS_KEY"] = config.get("AWS_SECRET_ACCESS_KEY")
    env["AWS_DEFAULT_REGION"] = config.get("AWS_REGION", "ap-south-1")

    # 2. Force delete and recreate Key Pair to get the PEM material
    key_name = "HireAI-Key"
    print(f"🔑 Recreating Key Pair: {key_name}...")
    run_command(f"aws ec2 delete-key-pair --key-name {key_name}", env)
    if os.path.exists(f"{key_name}.pem"):
        os.remove(f"{key_name}.pem")
    
    key_out = run_command(f"aws ec2 create-key-pair --key-name {key_name} --query \"KeyMaterial\" --output text", env)
    if key_out and "BEGIN RSA" in key_out:
        # Save with LF line endings for SSH compatibility
        with open(f"{key_name}.pem", "w", newline="\n") as f:
            f.write(key_out.strip())
        print(f"✅ Saved valid key to {key_name}.pem")
    else:
        print("❌ Failed to get Key Material. Check IAM permissions.")
        return

    # 3. Use verified VPC
    vpc_id = "vpc-0a1439ef582a7669a"
    print(f"✅ Using VPC: {vpc_id}")

    # 4. Check/Create Security Group
    sg_name = "HireAI-SG"
    sg_check = run_command(f"aws ec2 describe-security-groups --group-names {sg_name}", env)
    if not sg_check:
        print(f"🛡️ Creating Security Group: {sg_name}...")
        sg_res = run_command(f'aws ec2 create-security-group --group-name {sg_name} --description "HireAI-Portfolio-SG" --vpc-id {vpc_id}', env)
        if sg_res:
            sg_id = json.loads(sg_res)["GroupId"]
            print(f"✅ Created SG: {sg_id}")
            run_command(f"aws ec2 authorize-security-group-ingress --group-id {sg_id} --protocol tcp --port 22 --cidr 0.0.0.0/0", env)
            run_command(f"aws ec2 authorize-security-group-ingress --group-id {sg_id} --protocol tcp --port 3000 --cidr 0.0.0.0/0")
            run_command(f"aws ec2 authorize-security-group-ingress --group-id {sg_id} --protocol tcp --port 8000 --cidr 0.0.0.0/0")
    else:
        sg_id = json.loads(sg_check)["SecurityGroups"][0]["GroupId"]
        print(f"✅ Using existing SG: {sg_id}")

    # 5. Launch Instance
    ami_id = "ami-03bb6d83c60fc5f7c" 
    print(f"🚀 Launching t3.micro instance...")
    inst_res = run_command(f'aws ec2 run-instances --image-id {ami_id} --count 1 --instance-type t3.micro --key-name {key_name} --security-group-ids {sg_id} --tag-specifications "ResourceType=instance,Tags=[{{Key=Name,Value=HireAI-Demo}}]"', env)
    
    if inst_res:
        inst_id = json.loads(inst_res)["Instances"][0]["InstanceId"]
        print(f"⏳ Waiting for Public IP...")
        for _ in range(15):
            time.sleep(10)
            desc_res = run_command(f"aws ec2 describe-instances --instance-ids {inst_id}", env)
            if desc_res:
                data = json.loads(desc_res)
                ip = data["Reservations"][0]["Instances"][0].get("PublicIpAddress")
                if ip:
                    print(f"\n✨ SUCCESS! EC2 is live at {ip}")
                    return

    print("❌ Failed to launch instance.")

if __name__ == "__main__":
    setup_aws()
