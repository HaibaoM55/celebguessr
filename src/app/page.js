"use client"
import Image from "next/image";
import styles from "./page.module.css";
import { useState, useEffect} from 'react';
export default function Home() {
	const [userPfpNumber, setUserPfpNumber] = useState(1);
	const [UserPfp, setUserPfp] = useState("/profiles/guy1.png");
	const [kicked, setKicked] = useState(false);

	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const kickedParam = urlParams.get("kicked");
		if (kickedParam) {
			setKicked(kickedParam === "true");
		}
	}, []);
	function minusPfp(){
		setUserPfpNumber(userPfpNumber-1);
	}
	function plusPfp(){
		setUserPfpNumber(userPfpNumber+1);
	}
	useEffect(() => {
		if(userPfpNumber == 0){
			setUserPfpNumber(6);
		}else if(userPfpNumber == 7){
			setUserPfpNumber(1);
		}else{
			setUserPfp(`/profiles/guy${userPfpNumber}.png`)
		}
	}, [userPfpNumber])
	function askId(){
		console.log("pula")
	}
	useEffect(() => {
		if(kicked){
			document.getElementById("kickedDiv").style.opacity = '100%';
		}
	}, [kicked])
	return (
    	<div>
			{(kicked) ? (
				<div className={styles.overlay}>
					<div className={styles.kickedDiv} id = "kickedDiv">
						<p>You were kicked out of your last game</p>
						<br />
						<p>Please try again later</p>
						<button onClick={() => {
							setKicked(false);
						}} className = {styles.OKBtn}>OK</button>
					</div>
				</div>
			): (<></>)}
			<div className={styles.icon}>
				<Image src = "/icon.png" height={100} width={500} alt = "icon"/>
			</div>
			<div className={styles.inputDiv}>
				<div className = {styles.inputParent}>
					<input className={styles.input} placeholder="Enter your name"/>
				</div>
				<div className = {styles.pfp}>
					<Image className = {styles. arrow} src = "/leftarrow.svg" height = {50} width={50} alt = "left_arrow" onClick = {minusPfp}/>
					<Image src = {UserPfp}  height={128} width={128} alt = "profile_picture"/>
					<Image className = {styles.arrow} src = "/rightarrow.svg" height = {50} width={50} alt = "right_arrow" onClick = {plusPfp}/>
				</div>
				<div className = {styles.playBtnDiv}>
					<button className={styles.playBtn}>Play</button>
				</div>
				<div className = {styles.hostBtnDiv}>
					<button className={styles.hostBtn} onClick={askId()}>Host a game</button>
				</div>
			</div>
		</div>
	);
}
